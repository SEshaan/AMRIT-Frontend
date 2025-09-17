"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UploadIcon, BarChart3Icon, MapIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Upload', href: '/upload', icon: UploadIcon },
  { name: 'Classification', href: '/classification', icon: BarChart3Icon },
  { name: 'Visualization', href: '/map', icon: MapIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-x-3">
          <img
            className="h-10 w-auto"
            src="/logo.png"
            alt="AMRIT"
          />
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">AMRIT</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:text-accent-foreground hover:bg-accent',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-foreground">
                <UserIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                John Doe
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}