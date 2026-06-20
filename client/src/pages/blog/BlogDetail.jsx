import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchBlogBySlug, clearCurrentBlog, addComment } from '../../store/slices/blogSlice';
import { fetchPublishedBlogs } from '../../store/slices/blogSlice';
import Badge from '../../components/ui/Badge';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatDateTime } from '../../lib/helpers';

export default function BlogDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentBlog: blog, isLoading } = useSelector(state => state.blog);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [recentPosts, setRecentPosts] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogBySlug(slug));
    return () => dispatch(clearCurrentBlog());
  }, [dispatch, slug]);

  useEffect(() => {
    dispatch(fetchPublishedBlogs({ limit: 3 })).then(res => {
      if (res.payload?.blogs) {
        setRecentPosts(res.payload.blogs.filter(b => b.slug !== slug).slice(0, 3));
      }
    });
  }, [dispatch, slug]);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !blog?._id) return;
    dispatch(addComment({ id: blog._id, comment: commentText.trim() }));
    setCommentText('');
  };

  if (isLoading || !blog) return <PageLoader />;

  const post = blog.blog || blog;
  const title = post.title || blog.title;
  const content = post.content || blog.content || '';
  const image = post.coverImage?.url || blog.coverImage?.url || post.image?.url || '';
  const author = post.author || blog.author || {};
  const authorName = typeof author === 'object' ? author.name : author;
  const authorAvatar = typeof author === 'object' ? author.avatar?.url : '';
  const authorEmail = typeof author === 'object' ? author.email : '';
  const category = post.category || blog.category || '';
  const tags = post.tags || blog.tags || [];
  const createdAt = post.createdAt || blog.createdAt || post.publishedAt;
  const publishedAt = post.publishedAt || blog.publishedAt || createdAt;
  const excerpt = post.excerpt || blog.excerpt || '';
  const readTime = post.readTimeMinutes || blog.readTimeMinutes || Math.max(1, Math.ceil((content?.length || 0) / 1500));
  const viewCount = post.viewCount || blog.viewCount || 0;
  const comments = post.comments || blog.comments || [];

  const shareUrl = window.location.href;

  return (
    <>
      <Helmet>
        <title>{title} | Blog | Zalnio</title>
        {excerpt && <meta name="description" content={excerpt.replace(/<[^>]*>/g, '').slice(0, 160)} />}
        {image && <meta property="og:image" content={image} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt?.replace(/<[^>]*>/g, '').slice(0, 160)} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary-600">Blog</Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{title}</span>
        </nav>

        <article>
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {category && (
                <Link to={`/blog?category=${category.toLowerCase()}`}>
                  <Badge variant="primary">{category}</Badge>
                </Link>
              )}
              <span className="text-sm text-gray-400">{formatDate(publishedAt)}</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-400">{readTime} min read</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-400">{viewCount} views</span>
            </div>

            <h1 className="text-4xl font-display font-bold text-gray-900 mb-4 leading-tight">{title}</h1>

            {authorName && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">{authorName?.[0]}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-900">{authorName}</span>
                  {authorEmail && <p className="text-xs text-gray-500">{authorEmail}</p>}
                </div>
              </div>
            )}
          </div>

          {image && (
            <div className="aspect-video rounded-2xl overflow-hidden mb-10 shadow-md">
              <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
          )}

          {excerpt && (
            <div className="text-lg text-gray-600 italic border-l-4 border-primary-500 pl-4 mb-8">
              {excerpt.replace(/<[^>]*>/g, '')}
            </div>
          )}

          <div className="prose max-w-none text-gray-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: content }} />

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t">
              <span className="text-sm font-medium text-gray-500 mr-1">Tags:</span>
              {tags.map(tag => (
                <Link key={tag} to={`/blog?tag=${tag}`}>
                  <Badge variant="secondary">{tag}</Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 pt-6 border-t">
            <span className="text-sm font-medium text-gray-500">Share:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
              title="Share on Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
              title="Share on LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(shareUrl); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
              title="Copy link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Comments ({comments.length})
                </h2>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {showComments ? 'Hide' : 'Show'}
                </button>
              </div>
            </CardHeader>
            {showComments && (
              <CardBody>
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No comments yet. Be the first to comment!</p>
                ) : (
                  <div className="space-y-4 mb-6">
                    {comments.map((comment, idx) => (
                      <div key={comment._id || idx} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary-600">{comment.name?.[0] || 'U'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{comment.name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{comment.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isAuthenticated ? (
                  <form onSubmit={handleAddComment} className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add a Comment</label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Share your thoughts..."
                      required
                    />
                    <div className="mt-3 flex justify-end">
                      <Button type="submit" size="sm" disabled={!commentText.trim()}>Post Comment</Button>
                    </div>
                  </form>
                ) : (
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-gray-500">
                      <Link to="/auth/login" className="text-primary-600 hover:underline">Sign in</Link> to leave a comment
                    </p>
                  </div>
                )}
              </CardBody>
            )}
          </Card>
        </div>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map(post => {
                const p = post.blog || post;
                const pSlug = p.slug || post.slug;
                const pTitle = p.title || post.title;
                const pImage = p.coverImage?.url || post.coverImage?.url || '';
                const pExcerpt = p.excerpt || post.excerpt || '';
                const pDate = p.publishedAt || post.publishedAt || p.createdAt || post.createdAt;

                return (
                  <Link key={p._id || post._id} to={`/blog/${pSlug}`} className="group">
                    <Card className="h-full overflow-hidden">
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        {pImage ? (
                          <img src={pImage} alt={pTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-300">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <CardBody>
                        <p className="text-xs text-gray-400 mb-1">{formatDate(pDate)}</p>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">{pTitle}</h3>
                        {pExcerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pExcerpt.replace(/<[^>]*>/g, '')}</p>}
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/blog" className="text-primary-600 hover:underline font-medium inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </div>
    </>
  );
}
