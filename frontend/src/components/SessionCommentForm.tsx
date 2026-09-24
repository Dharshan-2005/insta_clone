import {auth} from "@/auth";
import CommentForm from "@/components/CommentForm";
import {apiFetch} from "@/lib/api";

export default async function SessionCommentForm({postId}:{postId:string}) {
  const session = await auth();
  const profile = await apiFetch('/users/profile').catch(() => null);
  const avatar = profile?.avatar || session?.user?.image || '';
  return (
    <CommentForm postId={postId} avatar={avatar} />
  );
}