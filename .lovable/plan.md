## Problème

L'erreur `403 — new row violates row-level security policy for table "tenants"` survient à l'étape 3 de l'onboarding au moment de cliquer **"Créer mon entreprise"**.

## Cause racine

La politique RLS d'insertion sur `tenants` (`WITH CHECK (auth.uid() = owner_id)`) est appliquée au rôle `public`, donc s'applique aussi bien aux requêtes anonymes qu'authentifiées. Quand `auth.uid()` retourne `NULL` (cas d'une requête envoyée sans bearer token JWT valide), la condition échoue → 403.

Deux facteurs aggravants dans le code actuel :

1. **Pas de garde de session** : `handleCreate` lance l'INSERT dès que `user` (state local) est défini, mais le client Supabase peut envoyer la requête avant que la session soit pleinement hydratée/rafraîchie sur le site publié.
2. **Politiques `TO public`** : si le token expire ou n'est pas attaché, la requête tombe en `anon` au lieu d'être rejetée explicitement comme non authentifiée.

## Plan de correction

### 1. Renforcer les politiques RLS (migration SQL)

Restreindre les politiques d'écriture sur `tenants`, `user_roles`, `tenant_members`, `tenant_modules` au rôle `authenticated` au lieu de `public`. Cela garantit qu'une requête sans JWT valide est rejetée proprement et ne tombe plus dans le piège `auth.uid() = NULL`.

```sql
DROP POLICY "Authenticated users can create tenants" ON public.tenants;
CREATE POLICY "Authenticated users can create tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);
```

(Idem pour les autres politiques d'écriture sensibles à l'authentification.)

### 2. Sécuriser la création côté client (`src/routes/onboarding.tsx`)

Avant l'INSERT, vérifier explicitement la session active :

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user) {
  toast.error("Session expirée, veuillez vous reconnecter");
  navigate({ to: "/auth" });
  return;
}
// utiliser session.user.id partout au lieu de user.id
```

Cela élimine le cas où le state React `user` est défini mais le token JWT n'est plus attaché à `supabase`.

### 3. Atomicité via une fonction RPC (optionnel mais recommandé)

Le flow actuel fait 4 INSERT séparés (`tenants`, `user_roles`, `tenant_members`, `tenant_modules`). Si un échoue après le premier, on a un tenant orphelin sans owner. Créer une fonction `SECURITY DEFINER` `create_tenant_with_owner(...)` qui exécute tout en une transaction et est appelée via `supabase.rpc(...)`.

Pour ce correctif, je propose de garder la version client (étapes 1+2) pour rester simple, et n'ajouter la RPC que si tu veux la robustesse transactionnelle.

### 4. Améliorer le message d'erreur

Aujourd'hui `toast.error(err.message)` affiche le message Postgres brut. Détecter le code `42501` / `PGRST301` et afficher un message clair en français : *« Session expirée. Reconnectez-vous pour créer votre entreprise. »*

## Fichiers impactés

- **Migration SQL** : politiques RLS sur `tenants`, `user_roles`, `tenant_members`, `tenant_modules` (passage à `TO authenticated`).
- **`src/routes/onboarding.tsx`** : garde de session avant `handleCreate`, message d'erreur amélioré.

## Question

Veux-tu également que j'ajoute la **fonction RPC atomique** (point 3) pour garantir qu'on n'aura jamais de tenant sans owner en cas d'échec partiel ? Cela ajoute ~30 lignes de SQL mais rend le système beaucoup plus robuste pour la mise sur le marché.