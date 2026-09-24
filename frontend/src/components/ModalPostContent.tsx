import { getSinglePostData } from "@/actions";
import SinglePostContent from "@/components/SinglePostContent";

export default async function ModalPostContent({ postId }: { postId: string }) {
  try {
    const {
      post, authorProfile, comments,
      commentsAuthors, myLike, myBookmark,
    } = await getSinglePostData(postId);

    return (
      <SinglePostContent
        post={post}
        authorProfile={authorProfile}
        comments={comments}
        commentsAuthors={commentsAuthors}
        myLike={myLike}
        myBookmark={myBookmark}
      />
    );
  } catch {
    return (
      <div className="p-8 text-center text-white bg-neutral-900 rounded-2xl">
        <p className="text-sm font-semibold text-neutral-300">Post not found</p>
        <p className="text-xs text-neutral-500 mt-1">This post may have been deleted or the link is invalid.</p>
      </div>
    );
  }
}