import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Evento, Inscricao, Ticket, FinancialTransaction } from '~/types';

const PRIMARY = '#1a7a45';
const GRAY_DARK = '#111827';
const GRAY_MID = '#6b7280';
const GRAY_LIGHT = '#d1d5db';
const BG_GREEN = '#e8f5ee';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: GRAY_DARK, backgroundColor: '#ffffff', paddingHorizontal: 40, paddingVertical: 36 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: PRIMARY },
  logo: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: PRIMARY, letterSpacing: -0.5 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GRAY_DARK },
  headerSub: { fontSize: 8, color: GRAY_MID, marginTop: 2 },
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BG_GREEN },
  // Stat chips
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statChip: { flex: 1, backgroundColor: BG_GREEN, borderRadius: 8, padding: 10 },
  statValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: PRIMARY },
  statLabel: { fontSize: 7, color: GRAY_MID, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  // Table
  table: { width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: BG_GREEN, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 2 },
  tableHeaderCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 8, color: GRAY_DARK },
  tableCellMuted: { fontSize: 8, color: GRAY_MID },
  // Presence
  presenceRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6, marginTop: 1 },
  // Progress bar
  progressTrack: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: PRIMARY, borderRadius: 4 },
  // Footer
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: GRAY_LIGHT, paddingTop: 8 },
  footerText: { fontSize: 7, color: GRAY_MID },
});

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

interface Props {
  evento: Evento;
  inscricoes: Inscricao[];
  tickets: Ticket[];
  saidas: FinancialTransaction[];
  geradoEm: string;
}

export default function RelatorioPDF({ evento, inscricoes, tickets, saidas, geradoEm }: Props) {
  const pagas    = inscricoes.filter(i => i.status === 'pago');
  const presentes = pagas.filter(i => i.presenca);
  const ausentes  = pagas.filter(i => !i.presenca);

  const totalArrecadado = pagas.reduce((s, i) => s + (i.valor_pago ?? 0), 0);
  const totalSaidas     = saidas.reduce((s, t) => s + t.valor, 0);
  const saldo           = totalArrecadado - totalSaidas;
  const taxaPresenca    = pagas.length > 0 ? Math.round((presentes.length / pagas.length) * 100) : 0;

  const byTicket = tickets.map(t => {
    const regs = pagas.filter(i => i.ticketId === t.id);
    return {
      nome: t.nome,
      vendidos: regs.length,
      receita: regs.reduce((s, i) => s + (i.valor_pago ?? 0), 0),
    };
  }).filter(t => t.vendidos > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>tovia</Text>
            <Text style={{ fontSize: 7, color: GRAY_MID, marginTop: 2 }}>Gestão de Eventos</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>{evento.nome}</Text>
            <Text style={s.headerSub}>{fmtDate(evento.data_inicio)} — {evento.local}</Text>
            <Text style={s.headerSub}>Relatório gerado em {geradoEm}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumo geral</Text>
          <View style={s.statsRow}>
            <View style={s.statChip}>
              <Text style={s.statValue}>{inscricoes.length}</Text>
              <Text style={s.statLabel}>Inscrições</Text>
            </View>
            <View style={s.statChip}>
              <Text style={s.statValue}>{pagas.length}</Text>
              <Text style={s.statLabel}>Confirmadas</Text>
            </View>
            <View style={s.statChip}>
              <Text style={s.statValue}>{presentes.length}</Text>
              <Text style={s.statLabel}>Presentes</Text>
            </View>
            <View style={{ ...s.statChip, backgroundColor: '#fff7ed' }}>
              <Text style={{ ...s.statValue, color: '#d97706' }}>{taxaPresenca}%</Text>
              <Text style={s.statLabel}>Taxa presença</Text>
            </View>
          </View>
          <View style={s.statsRow}>
            <View style={{ ...s.statChip, flex: 2 }}>
              <Text style={s.statValue}>{fmt(totalArrecadado)}</Text>
              <Text style={s.statLabel}>Total arrecadado</Text>
            </View>
            <View style={{ ...s.statChip, flex: 2, backgroundColor: '#fef2f2' }}>
              <Text style={{ ...s.statValue, color: '#dc2626' }}>{fmt(totalSaidas)}</Text>
              <Text style={s.statLabel}>Total saídas</Text>
            </View>
            <View style={{ ...s.statChip, flex: 2, backgroundColor: saldo >= 0 ? BG_GREEN : '#fef2f2' }}>
              <Text style={{ ...s.statValue, color: saldo >= 0 ? PRIMARY : '#dc2626' }}>{fmt(saldo)}</Text>
              <Text style={s.statLabel}>Saldo líquido</Text>
            </View>
          </View>
        </View>

        {/* By ticket */}
        {byTicket.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Vendas por ingresso</Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={{ ...s.tableHeaderCell, flex: 3 }}>Ingresso</Text>
                <Text style={{ ...s.tableHeaderCell, flex: 1, textAlign: 'right' }}>Vendidos</Text>
                <Text style={{ ...s.tableHeaderCell, flex: 2, textAlign: 'right' }}>Receita</Text>
              </View>
              {byTicket.map((t, i) => (
                <View key={t.nome} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={{ ...s.tableCell, flex: 3 }}>{t.nome}</Text>
                  <Text style={{ ...s.tableCell, flex: 1, textAlign: 'right' }}>{t.vendidos}</Text>
                  <Text style={{ ...s.tableCell, flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: PRIMARY }}>{fmt(t.receita)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Presence list */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Lista de presença — {presentes.length}/{pagas.length} ({taxaPresenca}%)
          </Text>
          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={{ ...s.progressFill, width: `${taxaPresenca}%` }} />
          </View>

          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.tableHeaderCell, flex: 3 }}>Nome</Text>
              <Text style={{ ...s.tableHeaderCell, flex: 2 }}>Ingresso</Text>
              <Text style={{ ...s.tableHeaderCell, flex: 1, textAlign: 'center' }}>Presença</Text>
              <Text style={{ ...s.tableHeaderCell, flex: 1, textAlign: 'right' }}>Horário</Text>
            </View>
            {pagas.map((insc, i) => (
              <View key={insc.id} style={[s.presenceRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <View style={{ ...s.dot, backgroundColor: insc.presenca ? PRIMARY : GRAY_LIGHT }} />
                <Text style={{ ...s.tableCell, flex: 3 }}>{insc.nome ?? '—'}</Text>
                <Text style={{ ...s.tableCellMuted, flex: 2 }}>{insc.ticket_nome ?? '—'}</Text>
                <Text style={{ ...s.tableCell, flex: 1, textAlign: 'center', color: insc.presenca ? PRIMARY : '#dc2626', fontFamily: 'Helvetica-Bold' }}>
                  {insc.presenca ? 'Sim' : 'Não'}
                </Text>
                <Text style={{ ...s.tableCellMuted, flex: 1, textAlign: 'right' }}>
                  {insc.checkin_at ? new Date(insc.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>tovia — Gestão de Eventos</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
