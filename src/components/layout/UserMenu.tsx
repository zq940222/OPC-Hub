"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings, UserRound, ClipboardList } from "lucide-react";
import { useState } from "react";

type UserMenuProps = {
  user: Session["user"];
};

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const label = user.name ?? "Account";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
      >
        <UserRound size={16} aria-hidden="true" />
        {label}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <MenuLink href={`/profile/${user.id}`} icon={<UserRound size={16} />}>
            My profile
          </MenuLink>
          <MenuLink href="/dashboard/orders" icon={<ClipboardList size={16} />}>
            My orders
          </MenuLink>
          <MenuLink href="/settings/profile" icon={<Settings size={16} />}>
            Account settings
          </MenuLink>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      {icon}
      {children}
    </Link>
  );
}
