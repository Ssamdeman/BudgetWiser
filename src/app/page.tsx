import { LogExpenseForm } from '@/components/log-expense-form';
import { AnalysisView } from '@/components/analysis-view';
import { SwipeableTabs } from '@/components/swipeable-tabs';

export default function Home() {
  const tabs = [
    {
      name: 'Data',
      content: <LogExpenseForm />,
    },
    {
      name: 'Analysis',
      content: <AnalysisView />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-10 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          <h1 className="text-6xl font-bold font-headline text-primary">Insights</h1>
        </div>
      </header>
      <main className="flex-1 px-4">
        <div className="max-w-md mx-auto">
          <SwipeableTabs tabs={tabs} />
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-muted-foreground">
      </footer>
    </div>
  );
}
