"use client";

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

type SwipeableTabsProps = {
  tabs: {
    name: string;
    content: React.ReactNode;
  }[];
  className?: string;
};

export function SwipeableTabs({ tabs, className }: SwipeableTabsProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [activeTab, setActiveTab] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = (api: CarouselApi) => {
      setActiveTab(api.selectedScrollSnap());
    };

    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const handleTabClick = (index: number) => {
    api?.scrollTo(index);
    setActiveTab(index);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex w-full bg-muted p-1 rounded-full mb-4 border border-border backdrop-blur-sm bg-opacity-50">
        {tabs.map((tab, index) => (
          <Button
            key={tab.name}
            variant={'ghost'}
            onClick={() => handleTabClick(index)}
            className={cn(
              'w-full transition-all duration-300 rounded-full z-10',
              activeTab === index ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground'
            )}
          >
            {tab.name}
          </Button>
        ))}
      </div>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {tabs.map((tab, index) => (
            <CarouselItem key={index}>{tab.content}</CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
