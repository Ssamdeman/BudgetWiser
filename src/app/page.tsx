import { LogExpenseForm } from '@/components/log-expense-form';
import { AnalysisView } from '@/components/analysis-view';
import { Wallet } from 'lucide-react';
import { SwipeableTabs } from '@/components/swipeable-tabs';

export default function Home() {
  const tabs = [
    {
      name: 'Log Expense',
      content: <LogExpenseForm />,
    },
    {
      name: 'Analysis',
      content: <AnalysisView />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Wallet className="size-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-primary">BudgetWise</h1>
        </div>
      </header>
      <main className="flex-1 px-4">
        <div className="max-w-md mx-auto">
          <SwipeableTabs tabs={tabs} />
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-muted-foreground">
        <p>Built with ❤️ for simple expense tracking.</p>
      </footer>
    </div>
  );
}
