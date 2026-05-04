import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceCompany {
  name: string;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  country_full?: string | null;
  phone_company?: string | null;
  email_company?: string | null;
  website?: string | null;
  tax_id?: string | null;
  cc_number?: string | null;
  bank_info?: string | null;
  signature_url?: string | null;
  invoice_footer?: string | null;
  invoice_prefix?: string | null;
  currency: string;
}

export interface InvoiceCustomer {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceData {
  reference: string;
  sold_at: string | Date;
  payment_method?: string | null;
  notes?: string | null;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  items: InvoiceItem[];
  customer?: InvoiceCustomer | null;
}

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imgFormatFromDataUrl(dataUrl: string): "PNG" | "JPEG" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  return "PNG";
}

/**
 * Generate an invoice PDF and trigger a download.
 * Returns the filename used.
 */
export async function generateInvoicePdf(
  company: InvoiceCompany,
  invoice: InvoiceData
): Promise<string> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  const primary: [number, number, number] = [37, 99, 235]; // blue-600
  const muted: [number, number, number] = [115, 115, 115];
  const dark: [number, number, number] = [23, 23, 23];

  // Header band
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, pageW, 42, "F");

  // Logo (if any)
  let leftCursorY = margin;
  if (company.logo_url) {
    const logoData = await fetchAsDataUrl(company.logo_url);
    if (logoData) {
      try {
        doc.addImage(logoData, imgFormatFromDataUrl(logoData), margin, margin - 5, 28, 28, undefined, "FAST");
      } catch {
        // ignore broken image
      }
    }
  }

  // Company info (right side of header)
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(company.name || "Entreprise", pageW - margin, margin, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const compLines = [
    company.address,
    [company.city, company.country_full].filter(Boolean).join(", "),
    company.phone_company ? `Tél : ${company.phone_company}` : null,
    company.email_company,
    company.website,
    company.tax_id ? `RCCM : ${company.tax_id}` : null,
    company.cc_number ? `CC : ${company.cc_number}` : null,
  ].filter((l): l is string => !!l && l.trim().length > 0);

  let y = margin + 6;
  compLines.forEach((line) => {
    doc.text(line, pageW - margin, y, { align: "right" });
    y += 4.5;
  });

  // Invoice title
  const titleY = 52;
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FACTURE", margin, titleY);

  doc.setTextColor(...muted);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const ref = `${company.invoice_prefix || ""}${invoice.reference}`;
  doc.text(`N° ${ref}`, margin, titleY + 6);
  doc.text(
    `Date : ${new Date(invoice.sold_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    margin,
    titleY + 11
  );
  if (invoice.payment_method) {
    doc.text(`Paiement : ${invoice.payment_method}`, margin, titleY + 16);
  }

  // Customer block
  const custX = pageW - margin - 70;
  const custY = titleY;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(custX, custY - 5, 70, 26, 2, 2, "FD");

  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURÉ À", custX + 3, custY);

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customer?.name || "Client de passage", custX + 3, custY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  let cy = custY + 10;
  const custLines = [
    invoice.customer?.phone,
    invoice.customer?.email,
    invoice.customer?.address,
    invoice.customer?.city,
  ].filter((l): l is string => !!l && l.trim().length > 0);
  custLines.slice(0, 3).forEach((line) => {
    doc.text(line, custX + 3, cy);
    cy += 4;
  });

  // Items table header
  let tableY = 92;
  doc.setFillColor(...primary);
  doc.rect(margin, tableY, pageW - 2 * margin, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Désignation", margin + 3, tableY + 6);
  doc.text("Qté", margin + 105, tableY + 6, { align: "right" });
  doc.text("P.U.", margin + 140, tableY + 6, { align: "right" });
  doc.text("Total", pageW - margin - 3, tableY + 6, { align: "right" });

  tableY += 9;
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const rowH = 7;
  invoice.items.forEach((it, idx) => {
    if (tableY > pageH - 60) {
      doc.addPage();
      tableY = margin;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 249, 251);
      doc.rect(margin, tableY, pageW - 2 * margin, rowH, "F");
    }
    const nameLines = doc.splitTextToSize(it.product_name, 90);
    doc.text(nameLines[0] || "", margin + 3, tableY + 5);
    doc.text(String(it.quantity), margin + 105, tableY + 5, { align: "right" });
    doc.text(fmtMoney(it.unit_price, company.currency), margin + 140, tableY + 5, { align: "right" });
    doc.text(fmtMoney(it.line_total, company.currency), pageW - margin - 3, tableY + 5, { align: "right" });
    tableY += rowH;
  });

  // Totals box
  tableY += 4;
  const totalsX = pageW - margin - 70;
  const totalsW = 70;

  const drawTotalLine = (label: string, val: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(...(bold ? primary : muted));
    doc.text(label, totalsX + 2, tableY + 5);
    doc.setTextColor(...dark);
    doc.text(val, totalsX + totalsW - 2, tableY + 5, { align: "right" });
    tableY += 6;
  };

  drawTotalLine("Sous-total", fmtMoney(invoice.subtotal, company.currency));
  if (invoice.discount && invoice.discount > 0) {
    drawTotalLine("Remise", `- ${fmtMoney(invoice.discount, company.currency)}`);
  }
  if (invoice.tax && invoice.tax > 0) {
    drawTotalLine("TVA", fmtMoney(invoice.tax, company.currency));
  }
  // Separator
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.4);
  doc.line(totalsX, tableY, totalsX + totalsW, tableY);
  tableY += 1;
  drawTotalLine("TOTAL TTC", fmtMoney(invoice.total, company.currency), true);

  // Bank info / notes
  let footerY = Math.max(tableY + 8, pageH - 60);
  if (footerY > pageH - 50) footerY = pageH - 50;

  if (company.bank_info) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    doc.text("Coordonnées bancaires", margin, footerY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    const bankLines = doc.splitTextToSize(company.bank_info, 90);
    doc.text(bankLines, margin, footerY + 4);
  }

  // Signature
  if (company.signature_url) {
    const sigData = await fetchAsDataUrl(company.signature_url);
    if (sigData) {
      try {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...dark);
        doc.text("Signature", pageW - margin - 50, footerY);
        doc.addImage(sigData, imgFormatFromDataUrl(sigData), pageW - margin - 50, footerY + 2, 40, 18, undefined, "FAST");
      } catch {
        // ignore
      }
    }
  }

  // Footer / legal mentions
  if (company.invoice_footer) {
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageH - 22, pageW - margin, pageH - 22);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    const footerLines = doc.splitTextToSize(company.invoice_footer, pageW - 2 * margin);
    doc.text(footerLines.slice(0, 3), pageW / 2, pageH - 17, { align: "center" });
  }

  // Page number
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text(`Facture générée le ${new Date().toLocaleDateString("fr-FR")}`, margin, pageH - 8);

  const filename = `Facture-${ref}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Convenience: load company info from current tenant + sale data, then generate.
 */
export async function generateInvoiceForSale(saleId: string, tenantId: string) {
  const [{ data: tenant }, { data: sale }, { data: items }] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    supabase.from("sales").select("*").eq("id", saleId).maybeSingle(),
    supabase
      .from("sale_items")
      .select("product_name,quantity,unit_price,line_total")
      .eq("sale_id", saleId),
  ]);
  if (!tenant || !sale) throw new Error("Données introuvables");

  let customer: InvoiceCustomer | null = null;
  if (sale.customer_id) {
    const { data: c } = await supabase
      .from("customers")
      .select("name,phone,email,address,city")
      .eq("id", sale.customer_id)
      .maybeSingle();
    customer = (c as InvoiceCustomer) || null;
  }

  const t = tenant as any;
  return generateInvoicePdf(
    {
      name: t.name,
      logo_url: t.logo_url,
      address: t.address,
      city: t.city,
      country_full: t.country_full,
      phone_company: t.phone_company,
      email_company: t.email_company,
      website: t.website,
      tax_id: t.tax_id,
      cc_number: t.cc_number,
      bank_info: t.bank_info,
      signature_url: t.signature_url,
      invoice_footer: t.invoice_footer,
      invoice_prefix: t.invoice_prefix,
      currency: t.currency || "XOF",
    },
    {
      reference: sale.reference,
      sold_at: sale.sold_at,
      payment_method: sale.payment_method,
      notes: sale.notes,
      subtotal: Number(sale.subtotal || 0),
      discount: Number(sale.discount || 0),
      tax: Number(sale.tax || 0),
      total: Number(sale.total || 0),
      items: ((items as any[]) || []).map((i) => ({
        product_name: i.product_name,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        line_total: Number(i.line_total),
      })),
      customer,
    }
  );
}
