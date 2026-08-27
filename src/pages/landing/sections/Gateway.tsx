
export function Gateway() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Transparência</span>
            <h2 className="text-3xl font-black text-foreground tracking-tight mt-3">
              Seu dinheiro vai direto para você
            </h2>
            <p className="text-muted-foreground mt-3 text-sm max-w-xl">
              Você conecta seu próprio gateway de pagamento e o dinheiro das inscrições cai direto na sua conta. A plataforma cobra apenas a assinatura mensal.
            </p>
          </div>
          <div className="rounded-2xl bg-violet-50 border border-violet-100 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Modelo BYOG</p>
            <p className="text-sm font-bold text-foreground mb-1">Bring Your Own Gateway</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você conecta o seu gateway de pagamento e o Tovia gera as cobranças por ele. O dinheiro cai direto na sua conta, sem intermediários.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { step: '1', title: 'Você cria o evento', desc: 'Configure inscrições, valores e formas de pagamento no Tovia.' },
            { step: '2', title: 'Participante paga', desc: 'O pagamento é processado direto pela sua conta no gateway. O valor vai para você.' },
            { step: '3', title: 'Dinheiro na sua conta', desc: 'O valor cai na sua conta conforme as regras do seu gateway. Você tem controle total.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shrink-0">{item.step}</div>
              <div>
                <p className="font-bold text-foreground text-sm">{item.title}</p>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <a
            href="https://www.asaas.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-3xl p-6 text-white block hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: '#0033FF' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Gateway disponível</p>
            <div className="mb-4">
              <img src="/asaas-logo.svg" alt="Asaas" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              O Tovia se integra com o Asaas. Você cria sua conta no Asaas, conecta ao Tovia e começa a receber. Simples assim.
            </p>
            <p className="text-xs text-white/50 mt-3">
              Em breve: Stripe, Mercado Pago e Pagar.me.
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-white/60">Clique e conheça mais sobre o Asaas</p>
            </div>
          </a>

          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Formas de pagamento disponíveis</p>
            <div className="space-y-3">
              {[
                { method: 'PIX',               fee: 'R$ 1,99 por transação',  color: 'bg-orange-50 text-primary' },
                { method: 'Boleto Bancário',   fee: 'R$ 1,99 por boleto',     color: 'bg-orange-50 text-orange-700'  },
                { method: 'Cartão de crédito', fee: '2,99% + R$ 0,49',       color: 'bg-blue-50 text-blue-700'      },
                { method: 'Parcelado',         fee: '3,49% + R$ 0,49/parc.', color: 'bg-violet-50 text-violet-700'  },
              ].map(item => (
                <div key={item.method} className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.method}</span>
                  <span className="text-xs text-muted-foreground">{item.fee}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
              Taxas cobradas pelo Asaas diretamente ao organizador. Valores podem variar conforme o plano contratado com o gateway.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
