import React from 'react';
import { useTheme } from '../../lib/ThemeProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsTab() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { id: 'light', label: 'Claro', icon: Sun, description: 'Visual mais brilhante e clássico' },
    { id: 'dark', label: 'Escuro', icon: Moon, description: 'Confortável para ambientes pouco iluminados' },
    { id: 'system', label: 'Sistema', icon: Monitor, description: 'Segue as configurações do seu dispositivo' },
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua experiência no Ekko</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Tema do Sistema</CardTitle>
              <CardDescription>Escolha como o Ekko deve aparecer para você</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all group ${
                  theme === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-transparent bg-muted/50 hover:bg-muted dark:bg-card dark:hover:bg-accent/50'
                }`}
              >
                <div className={`p-3 rounded-xl mb-4 transition-colors ${
                  theme === option.id ? 'bg-primary text-white' : 'bg-background text-muted-foreground group-hover:text-foreground'
                }`}>
                  <option.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">{option.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Visual sample of current palette */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
         <div className="p-4 bg-primary rounded-2xl text-white font-bold text-center">Primária</div>
         <div className="p-4 bg-secondary rounded-2xl text-secondary-foreground font-bold text-center">Secundária</div>
         <div className="p-4 bg-accent rounded-2xl text-accent-foreground font-bold text-center border border-border">Sotaque</div>
         <div className="p-4 bg-card rounded-2xl text-card-foreground font-bold text-center border border-border">Cartão</div>
      </div>
    </motion.div>
  );
}
