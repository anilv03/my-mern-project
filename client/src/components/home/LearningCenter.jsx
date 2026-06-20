import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/helpers';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Skeleton } from '../ui/Loader';

const CourseCard = ({ course }) => (
  <Link to={`/products/${course.slug}`} className="group block">
    <Card padding={false} className="overflow-hidden h-full hover:shadow-lg hover:border-primary-200 transition-all duration-300">
      <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
        {course.images?.[0]?.url ? (
          <img
            src={course.images[0].url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-100 to-primary-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-3 line-clamp-2">
          {course.title}
        </h3>
        <div className="space-y-1.5 text-sm text-gray-500 mb-4">
          {course.instructor && (
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {course.instructor}
            </p>
          )}
          {course.duration && (
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.duration}
            </p>
          )}
          {course.enrollmentCount > 0 && (
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {course.enrollmentCount.toLocaleString()} enrolled
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {course.pricing?.sellingPrice ? formatPrice(course.pricing.sellingPrice) : 'Free'}
          </span>
          {course.pricing?.originalPrice > course.pricing?.sellingPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(course.pricing.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Card>
  </Link>
);

const CourseCardSkeleton = () => (
  <Card padding={false} className="overflow-hidden">
    <Skeleton variant="image" className="aspect-[16/9]" />
    <div className="p-5 space-y-3">
      <Skeleton variant="title" className="w-3/4" />
      <div className="space-y-1">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
      <Skeleton variant="text" className="w-1/4" />
    </div>
  </Card>
);

const LearningCenter = ({ courses = [], loading = false }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold text-gray-900">Learning Center</h2>
        {!loading && courses.length > 0 && (
          <Link to="/products?type=video_course">
            <Button variant="outline" size="sm">Explore All Courses</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.slice(0, 3).map(course => <CourseCard key={course._id} course={course} />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No courses available yet.</p>
          <Link to="/products?type=video_course">
            <Button variant="outline" size="sm">Browse Courses</Button>
          </Link>
        </div>
      )}
    </section>
  );
};

export default LearningCenter;
