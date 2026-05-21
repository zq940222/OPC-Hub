import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { FollowButton } from "@/components/profile/FollowButton";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { db } from "@/lib/db";

export default async function ProfilePage(props: { params: Promise<{ userId: string }> }) {
  const { userId } = await props.params;
  const session = await auth();
  const viewerId = session?.user?.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      opcProfile: true,
      orders: {
        where: { status: "COMPLETED" },
        select: { id: true, title: true, amount: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
      posts: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          board: { select: { slug: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      followers: {
        include: { follower: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      following: {
        include: { following: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const [higherPointUsers, viewerFollow] = await Promise.all([
    db.user.count({ where: { points: { gt: user.points } } }),
    viewerId && viewerId !== user.id
      ? db.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
      : null,
  ]);
  const rank = higherPointUsers + 1;
  const isSelf = viewerId === user.id;

  return (
    <main className="shell grid gap-6 py-8 md:py-12 lg:grid-cols-[340px_1fr]">
      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-blue-100 bg-cover bg-center text-xl font-semibold text-blue-700"
              style={user.image ? { backgroundImage: `url(${user.image})` } : undefined}
              aria-label={user.name ?? "OPC"}
            >
              {user.image ? null : (user.name ?? "O").slice(0, 1)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-950">{user.name ?? user.email ?? user.phone ?? "OPC"}</h1>
              <p className="mt-1 text-sm text-slate-500">Joined {user.createdAt.toLocaleDateString("zh-CN")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-sm text-slate-600">
            <p>Location: {user.opcProfile?.location ?? "Not set"}</p>
            <p>Points: {user.points}</p>
            <p>Rank: #{rank}</p>
            <p>Completed orders: {user.orders.length}</p>
            <p>
              Followers: {user.followers.length} / Following: {user.following.length}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(user.opcProfile?.skills ?? []).map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {skill}
              </span>
            ))}
          </div>

          {user.opcProfile?.bio ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{user.opcProfile.bio}</p> : null}
          {user.opcProfile?.website ? (
            <a href={user.opcProfile.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
              Website
            </a>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {isSelf ? (
              <Link href="/settings/profile" className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                Edit profile
              </Link>
            ) : viewerId ? (
              <FollowButton userId={user.id} initialFollowing={Boolean(viewerFollow)} />
            ) : (
              <Link href="/login" className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                Login to follow
              </Link>
            )}
          </div>
        </section>
      </aside>

      <ProfileTabs
        completedOrders={user.orders.map((order) => ({ ...order, amount: order.amount.toString() }))}
        posts={user.posts}
        followers={user.followers}
        following={user.following}
      />
    </main>
  );
}
