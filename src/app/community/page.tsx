import { ModulePage, PrimaryLink } from "@/components/layout/ModulePage";

export default function CommunityPage() {
  return (
    <ModulePage
      eyebrow="交流社区"
      title="经验分享、问答互助与资源汇总"
      description="社区将支持发帖、回复、点赞、举报、积分与关注关系，本期先保留导航和权限入口。"
      actions={<PrimaryLink href="/community/messages">私信</PrimaryLink>}
    />
  );
}
