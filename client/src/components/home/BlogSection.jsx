import { Link } from 'react-router-dom';
import { formatDate, truncateText } from '../../lib/helpers';
import Card from '../ui/Card';
import { Skeleton } from '../ui/Loader';

const BlogCard = ({ post }) => (
  <Link to={`/blog/${post.slug}`} className="group block">
    <Card padding={false} className="overflow-hidden h-full hover:shadow-lg hover:border-primary-200 transition-all duration-300">
      <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
        {post.coverImage?.url ? (
          <img
            src={post.coverImage.url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200" />
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {truncateText(post.excerpt, 120)}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {post.author && (
              <>
                <span>{post.author.name}</span>
                <span className="text-gray-300">•</span>
              </>
            )}
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          {post.readTimeMinutes && (
            <span>{post.readTimeMinutes} min read</span>
          )}
        </div>
      </div>
    </Card>
  </Link>
);

const BlogCardSkeleton = () => (
  <Card padding={false} className="overflow-hidden">
    <Skeleton variant="image" className="aspect-[16/9]" />
    <div className="p-5 space-y-3">
      <Skeleton variant="title" className="w-3/4" />
      <div className="space-y-1">
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
    </div>
  </Card>
);

const BlogSection = ({ posts = [], loading = false }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold text-gray-900">Latest from Blog</h2>
        {!loading && posts.length > 0 && (
          <Link
            to="/blog"
            className="inline-flex items-center justify-center px-4 py-2 border-2 border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors text-sm"
          >
            View All Blog
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <BlogCardSkeleton key={i} />)}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map(post => <BlogCard key={post._id} post={post} />)}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-12">No blog posts yet.</p>
      )}
    </section>
  );
};

export default BlogSection;
