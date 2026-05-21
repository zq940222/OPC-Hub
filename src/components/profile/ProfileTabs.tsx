"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@/components/orders/OrderCard";

type ProfileTabsProps = {
  completedOrders: Array<{ id: string; title: string; amount: string; updatedAt: Date }>;
  posts: Array<{ id: string; title: string; createdAt: Date; board: { slug: string; name: string } }>;
  followers: Array<{ follower: { id: string; name: string | null; email: string | null } }>;
  following: Array<{ following: { id: string; name: string | null; email: string | null } }>;
};

export function ProfileTabs({ completedOrders, posts, followers, following }: ProfileTabsProps) {
  const [tab, setTab] = useState<"orders" | "posts" | "followers" | "following">("orders");
  const buttonClass = (value: typeof tab) =>
    `focus-ring rounded-md px-4 py-2 text-sm font-semibold ${tab === value ? "bg-blue-700 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`;

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("orders")} className={buttonClass("orders")}>
          已完成订单
        </button>
        <button type="button" onClick={() => setTab("posts")} className={buttonClass("posts")}>
          帖子
        </button>
        <button type="button" onClick={() => setTab("followers")} className={buttonClass("followers")}>
          粉丝
        </button>
        <button type="button" onClick={() => setTab("following")} className={buttonClass("following")}>
          关注
        </button>
      </div>

      {tab === "orders" ? (
        <div className="grid gap-3">
          {completedOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-200">
              <p className="font-semibold text-slate-950">{order.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatAmount(order.amount)} / {order.updatedAt.toLocaleDateString("zh-CN")}
              </p>
            </Link>
          ))}
          {completedOrders.length === 0 ? <EmptyState text="暂无已完成订单。" /> : null}
        </div>
      ) : null}

      {tab === "posts" ? (
        <div className="grid gap-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/post/${post.id}`} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-200">
              <p className="font-semibold text-slate-950">{post.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {post.board.name} / {post.createdAt.toLocaleDateString("zh-CN")}
              </p>
            </Link>
          ))}
          {posts.length === 0 ? <EmptyState text="暂无帖子。" /> : null}
        </div>
      ) : null}

      {tab === "followers" ? (
        <PeopleList people={followers.map((item) => item.follower)} emptyText="暂无粉丝。" />
      ) : null}

      {tab === "following" ? (
        <PeopleList people={following.map((item) => item.following)} emptyText="暂未关注任何人。" />
      ) : null}
    </section>
  );
}

function PeopleList({ people, emptyText }: { people: Array<{ id: string; name: string | null; email: string | null }>; emptyText: string }) {
  if (people.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {people.map((person) => (
        <Link key={person.id} href={`/profile/${person.id}`} className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-slate-950 hover:border-blue-200">
          {person.name ?? person.email ?? "OPC"}
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">{text}</p>;
}
