import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PaginaVenda, Evento, Ticket, UserProfile, CampoFormulario } from '../types';

interface Props {
  evento: Evento;
  pagina: PaginaVenda;
  tickets: Ticket[];
  organizerProfile: UserProfile | null;
}

const PRIMARY = '#7C3AED';
const GRAY_DARK = '#1a1a1a';
const GRAY_MID = '#555555';
const GRAY_LIGHT = '#888888';
const BORDER = '#bbbbbb';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    color: GRAY_DARK,
  },

  // ── Header ──────────────────────────────────────────────
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 10 },
  logoWrapper: {
    width: 56, height: 56, borderRadius: 6,
    backgroundColor: '#f3f0ff', overflow: 'hidden',
    flexShrink: 0, alignItems: 'center', justifyContent: 'center',
  },
  logo: { width: 56, height: 56, objectFit: 'cover' },
  headerRight: { flex: 1, justifyContent: 'center', gap: 2 },
  instituicaoLabel: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY_LIGHT,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  eventoNome: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GRAY_DARK, lineHeight: 1.2 },
  paginaNome: { fontSize: 8, color: PRIMARY, fontFamily: 'Helvetica-Bold', marginTop: 1 },

  // ── Divider ──────────────────────────────────────────────
  dividerPrimary: { borderBottomWidth: 2, borderBottomColor: PRIMARY, marginBottom: 8 },

  // ── Info chips ───────────────────────────────────────────
  infoStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
  },
  infoChipLabel: {
    fontSize: 7, color: GRAY_LIGHT, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  infoChipValue: { fontSize: 8, color: GRAY_MID, fontFamily: 'Helvetica-Bold' },

  // ── Description block ────────────────────────────────────
  descBlock: { marginBottom: 10 },
  descText: { fontSize: 7.5, color: GRAY_MID, lineHeight: 1.5 },

  // ── Section title ────────────────────────────────────────
  fichaTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: PRIMARY,
    textAlign: 'center', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 2,
  },

  // ── Table cells ──────────────────────────────────────────
  tableRow: { flexDirection: 'row' },
  // non-last cell in a row: borderRight will double up with next cell's left, accepted at 0.7px
  cell: { flex: 1, borderWidth: 0.7, borderColor: BORDER, padding: 5, minHeight: 30, marginRight: -0.35 },
  cellLast: { flex: 1, borderWidth: 0.7, borderColor: BORDER, padding: 5, minHeight: 30, marginLeft: -0.35 },
  cellFull: { borderWidth: 0.7, borderColor: BORDER, padding: 5, minHeight: 30 },
  cellTextarea: { borderWidth: 0.7, borderColor: BORDER, padding: 5, minHeight: 48 },
  cellLabel: {
    fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: GRAY_LIGHT,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },

  // ── Options (select) ─────────────────────────────────────
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optionCircle: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 0.8, borderColor: '#999' },
  optionText: { fontSize: 7.5, color: GRAY_MID },

  // ── Checkbox in cell ─────────────────────────────────────
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  checkboxSquare: { width: 9, height: 9, borderWidth: 0.8, borderColor: '#999', borderRadius: 1 },
  checkboxText: { fontSize: 7.5, color: GRAY_MID },

  // ── Tickets (multiple) ───────────────────────────────────
  ticketOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 3 },
  ticketItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketCircle: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 0.8, borderColor: '#999' },
  ticketText: { fontSize: 7.5, color: GRAY_MID },

  // ── Payment methods ──────────────────────────────────────
  paymentSectionLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GRAY_DARK, marginBottom: 5 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '50%', marginBottom: 5 },
  paymentCircle: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 0.8, borderColor: '#999' },
  paymentText: { fontSize: 7.5, color: GRAY_MID },
  paymentLine: { borderBottomWidth: 0.7, borderBottomColor: BORDER, width: 44, marginLeft: 3 },

  // ── Terms ( ) Sim ( ) Não ────────────────────────────────
  termsCell: {
    borderWidth: 0.7, borderColor: BORDER, padding: 6, minHeight: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  termsText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRAY_MID },
  termsOption: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  termsCircle: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 0.8, borderColor: '#888' },
  termsOptionText: { fontSize: 8, color: GRAY_MID },

  // ── LGPD consent ─────────────────────────────────────────
  lgpdRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 7, marginTop: 10, paddingHorizontal: 2,
  },
  lgpdSquare: {
    width: 10, height: 10, borderWidth: 0.8, borderColor: '#999',
    borderRadius: 1, flexShrink: 0, marginTop: 1,
  },
  lgpdText: { flex: 1, fontSize: 7, color: GRAY_LIGHT, lineHeight: 1.4 },

  // ── Signature area ────────────────────────────────────────
  signatureArea: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 18, gap: 24,
  },
  signatureBlock: { flex: 1 },
  signatureLine: { borderBottomWidth: 0.8, borderBottomColor: '#666', marginBottom: 4, height: 18 },
  signatureLabel: { fontSize: 7, color: GRAY_LIGHT },
  dateBlock: { width: 120 },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    marginTop: 10, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  footerText: { fontSize: 6, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 1 },
  footerDot: { width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: '#c4b5fd' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ticketLabel(ticket: Ticket): string {
  if (ticket.tipo === 'gratuito') return `${ticket.nome} — Gratuito`;
  if (ticket.tipo === 'doacao') return `${ticket.nome} — Doação`;
  return `${ticket.nome} — ${formatCurrency(ticket.valor)}`;
}

// ─── Field grouping ────────────────────────────────────────────────────────

const SHORT_TYPES: CampoFormulario['tipo'][] = ['texto', 'email', 'telefone', 'numero', 'data'];

function isShort(c: CampoFormulario) {
  return SHORT_TYPES.includes(c.tipo);
}

function renderFormFields(campos: CampoFormulario[]) {
  const rows: React.ReactNode[] = [];
  let i = 0;
  while (i < campos.length) {
    const c = campos[i];
    const asterisk = c.obrigatorio ? ' *' : '';

    if (isShort(c) && i + 1 < campos.length && isShort(campos[i + 1])) {
      const c2 = campos[i + 1];
      rows.push(
        <View key={c.id} style={styles.tableRow}>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{c.label}{asterisk}</Text>
          </View>
          <View style={styles.cellLast}>
            <Text style={styles.cellLabel}>{c2.label}{c2.obrigatorio ? ' *' : ''}</Text>
          </View>
        </View>
      );
      i += 2;
    } else if (c.tipo === 'textarea') {
      rows.push(
        <View key={c.id} style={styles.cellTextarea}>
          <Text style={styles.cellLabel}>{c.label}{asterisk}</Text>
        </View>
      );
      i++;
    } else if (c.tipo === 'select' && c.opcoes && c.opcoes.length > 0) {
      rows.push(
        <View key={c.id} style={[styles.cellFull, { minHeight: 36 }]}>
          <Text style={styles.cellLabel}>{c.label}{asterisk}</Text>
          <View style={styles.optionsRow}>
            {c.opcoes.map((op, idx) => (
              <View key={idx} style={styles.optionItem}>
                <View style={styles.optionCircle} />
                <Text style={styles.optionText}>{op}</Text>
              </View>
            ))}
          </View>
        </View>
      );
      i++;
    } else if (c.tipo === 'checkbox') {
      rows.push(
        <View key={c.id} style={styles.cellFull}>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxSquare} />
            <Text style={styles.checkboxText}>{c.label}{asterisk}</Text>
          </View>
        </View>
      );
      i++;
    } else {
      // single short field, full width
      rows.push(
        <View key={c.id} style={styles.cellFull}>
          <Text style={styles.cellLabel}>{c.label}{asterisk}</Text>
        </View>
      );
      i++;
    }
  }
  return rows;
}

// ─── Main document ─────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { label: 'Boleto (todo dia 10)', hasInstallments: false },
  { label: 'Cartão de Débito', hasInstallments: false },
  { label: 'Cartão de Crédito | Em quantas vezes?', hasInstallments: true },
  { label: 'Dinheiro', hasInstallments: false },
];

export default function FichaInscricaoPDF({ evento, pagina, tickets, organizerProfile }: Props) {
  const logoUrl = organizerProfile?.imagem_url || null;
  const instituicao = evento.instituicao || organizerProfile?.nome || '';
  const dataInicio = evento.data_inicio ? formatDate(evento.data_inicio) : '';
  const dataFim = evento.data_fim ? formatDate(evento.data_fim) : '';
  const dataEvento = dataFim && dataFim !== dataInicio ? `${dataInicio} a ${dataFim}` : dataInicio;

  return (
    <Document
      title={`Ficha de Inscrição — ${evento.nome}`}
      author="Tovia"
      creator="Tovia Gestão de Eventos"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          {logoUrl && (
            <View style={styles.logoWrapper}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}
          <View style={styles.headerRight}>
            {instituicao ? <Text style={styles.instituicaoLabel}>{instituicao}</Text> : null}
            <Text style={styles.eventoNome}>{evento.nome}</Text>
            {pagina.nome !== evento.nome && (
              <Text style={styles.paginaNome}>{pagina.nome}</Text>
            )}
          </View>
        </View>

        {/* ── Divider ─────────────────────────────────────── */}
        <View style={styles.dividerPrimary} />

        {/* ── Info chips ──────────────────────────────────── */}
        <View style={styles.infoStrip}>
          {evento.local ? (
            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Local</Text>
              <Text style={styles.infoChipValue}>{evento.local}</Text>
            </View>
          ) : null}
          {dataEvento ? (
            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Data</Text>
              <Text style={styles.infoChipValue}>{dataEvento}</Text>
            </View>
          ) : null}
          {tickets.map(t => (
            <View key={t.id} style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Investimento</Text>
              <Text style={styles.infoChipValue}>{ticketLabel(t)}</Text>
            </View>
          ))}
        </View>

        {/* ── Description ─────────────────────────────────── */}
        {pagina.descricao ? (
          <View style={styles.descBlock}>
            <Text style={styles.descText}>{pagina.descricao}</Text>
          </View>
        ) : null}

        {/* ── Section title ────────────────────────────────── */}
        <Text style={styles.fichaTitle}>Ficha de Inscrição</Text>

        {/* ── Form fields in bordered cells ───────────────── */}
        {renderFormFields(pagina.campos_formulario)}

        {/* ── Ticket selection (only if multiple options) ─── */}
        {tickets.length > 1 && (
          <View style={[styles.cellFull, { minHeight: 38 }]}>
            <Text style={styles.cellLabel}>Ingresso / Categoria *</Text>
            <View style={styles.ticketOptionsRow}>
              {tickets.map(t => (
                <View key={t.id} style={styles.ticketItem}>
                  <View style={styles.ticketCircle} />
                  <Text style={styles.ticketText}>{ticketLabel(t)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Payment methods ─────────────────────────────── */}
        <View style={[styles.cellFull, { minHeight: 52 }]}>
          <Text style={styles.paymentSectionLabel}>
            Qual a forma de pagamento? Escolha apenas UMA opção.
          </Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map(({ label, hasInstallments }) => (
              <View key={label} style={styles.paymentOption}>
                <View style={styles.paymentCircle} />
                <Text style={styles.paymentText}>{label}</Text>
                {hasInstallments && <View style={styles.paymentLine} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Terms agreement ─────────────────────────────── */}
        <View style={styles.termsCell}>
          <Text style={styles.termsText}>Concorda com os termos da inscrição?</Text>
          <View style={styles.termsOption}>
            <View style={styles.termsCircle} />
            <Text style={styles.termsOptionText}>Sim</Text>
          </View>
          <View style={styles.termsOption}>
            <View style={styles.termsCircle} />
            <Text style={styles.termsOptionText}>Não</Text>
          </View>
        </View>

        {/* ── LGPD consent ─────────────────────────────────── */}
        <View style={styles.lgpdRow}>
          <View style={styles.lgpdSquare} />
          <Text style={styles.lgpdText}>
            Declaro que li e concordo com o registro e uso dos dados fornecidos nesta ficha de inscrição, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), para fins exclusivos de gestão e organização deste evento.
          </Text>
        </View>

        {/* ── Signature ────────────────────────────────────── */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Assinatura do Participante</Text>
          </View>
          <View style={styles.dateBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Data da inscrição: ____/____/________</Text>
          </View>
        </View>

        {/* ── Footer ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Tovia</Text>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Gestão de Eventos</Text>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>tovia.app</Text>
        </View>

      </Page>
    </Document>
  );
}
