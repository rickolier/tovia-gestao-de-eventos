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
const BORDER = '#cccccc';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 44,
    backgroundColor: '#FFFFFF',
    color: GRAY_DARK,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f0ff',
    overflow: 'hidden',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: 'cover',
  },
  headerRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  instituicaoLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  eventoNome: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_DARK,
    lineHeight: 1.2,
  },
  paginaNome: {
    fontSize: 8.5,
    color: PRIMARY,
    fontFamily: 'Helvetica-Bold',
    marginTop: 1,
  },

  // ── Divider ──────────────────────────────────────────────
  dividerPrimary: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    marginBottom: 10,
  },
  dividerThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    marginVertical: 10,
  },

  // ── Info strip ───────────────────────────────────────────
  infoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  infoChipLabel: {
    fontSize: 7,
    color: GRAY_LIGHT,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoChipValue: {
    fontSize: 8,
    color: GRAY_MID,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Section title ────────────────────────────────────────
  fichaTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },

  // ── Form fields ──────────────────────────────────────────
  fieldWrapper: {
    marginBottom: 13,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  requiredDot: {
    color: PRIMARY,
  },
  fieldLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: BORDER,
    height: 18,
  },
  fieldBox: {
    borderWidth: 0.7,
    borderColor: BORDER,
    height: 52,
    borderRadius: 2,
    marginTop: 2,
  },

  // ── Select ───────────────────────────────────────────────
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  optionCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 0.9,
    borderColor: '#999',
  },
  optionText: {
    fontSize: 8,
    color: GRAY_MID,
  },

  // ── Checkbox ─────────────────────────────────────────────
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  checkboxSquare: {
    width: 10,
    height: 10,
    borderWidth: 0.9,
    borderColor: '#999',
    borderRadius: 1,
  },
  checkboxText: {
    fontSize: 8,
    color: GRAY_MID,
  },

  // ── Two-column layout ─────────────────────────────────────
  twoCol: {
    flexDirection: 'row',
    gap: 16,
  },
  colHalf: {
    flex: 1,
  },

  // ── Signature area ────────────────────────────────────────
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 28,
    gap: 24,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#666',
    marginBottom: 4,
    height: 18,
  },
  signatureLabel: {
    fontSize: 7,
    color: GRAY_LIGHT,
    fontFamily: 'Helvetica',
  },
  dateBlock: {
    width: 110,
  },

  // ── LGPD consent ──────────────────────────────────────────
  lgpdRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 20,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  lgpdSquare: {
    width: 11,
    height: 11,
    borderWidth: 0.9,
    borderColor: '#999',
    borderRadius: 1,
    flexShrink: 0,
    marginTop: 1,
  },
  lgpdText: {
    flex: 1,
    fontSize: 7.5,
    color: GRAY_MID,
    lineHeight: 1.5,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 6.5,
    color: '#c4b5fd',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#c4b5fd',
  },
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

// ─── Field renderer ────────────────────────────────────────────────────────

function renderField(campo: CampoFormulario) {
  const asterisk = campo.obrigatorio ? ' *' : '';

  if (campo.tipo === 'select' && campo.opcoes && campo.opcoes.length > 0) {
    return (
      <View key={campo.id} style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>
          {campo.label}{asterisk}
        </Text>
        <View style={styles.optionsRow}>
          {campo.opcoes.map((op, i) => (
            <View key={i} style={styles.optionItem}>
              <View style={styles.optionCircle} />
              <Text style={styles.optionText}>{op}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (campo.tipo === 'checkbox') {
    return (
      <View key={campo.id} style={styles.fieldWrapper}>
        <View style={styles.checkboxItem}>
          <View style={styles.checkboxSquare} />
          <Text style={styles.checkboxText}>
            {campo.label}{asterisk}
          </Text>
        </View>
      </View>
    );
  }

  if (campo.tipo === 'textarea') {
    return (
      <View key={campo.id} style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{campo.label}{asterisk}</Text>
        <View style={styles.fieldBox} />
      </View>
    );
  }

  return (
    <View key={campo.id} style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{campo.label}{asterisk}</Text>
      <View style={styles.fieldLine} />
    </View>
  );
}

// ─── Main document ─────────────────────────────────────────────────────────

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
              <Text style={styles.infoChipLabel}>Ingresso</Text>
              <Text style={styles.infoChipValue}>{ticketLabel(t)}</Text>
            </View>
          ))}
        </View>

        {/* ── Section title ────────────────────────────────── */}
        <Text style={styles.fichaTitle}>Ficha de Inscrição</Text>

        {/* ── Form fields ─────────────────────────────────── */}
        {pagina.campos_formulario.map(campo => renderField(campo))}

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
            <Text style={styles.signatureLabel}>Data: ____/____/________</Text>
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
