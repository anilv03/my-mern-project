import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCourses } from '../../store/slices/contentSlice';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate } from '../../lib/helpers';

export default function MyCourses() {
  const dispatch = useDispatch();
  const { courses, isLoading } = useSelector(state => state.content);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const filtered = courses.filter(c => {
    if (filter === 'in-progress') return !c.completed && c.progressPercent > 0;
    if (filter === 'completed') return c.completed;
    if (filter === 'not-started') return c.progressPercent === 0;
    return true;
  });

  if (isLoading && courses.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>My Courses | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">Continue learning where you left off.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {[
            { value: 'all', label: 'All Courses' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'not-started', label: 'Not Started' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500 mb-6">Purchase a video course to start learning.</p>
                <Link to="/products?type=video_course"><Button variant="primary">Browse Courses</Button></Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <Link key={course._id} to={`/my-courses/${course._id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardBody>
                    <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-4">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" size="xs">Video Course</Badge>
                      <span className="text-xs text-gray-500">{course.totalVideos} lessons</span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{course.completedVideosCount}/{course.totalVideos} completed</span>
                        <span>{course.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${course.completed ? 'bg-green-500' : 'bg-primary-500'}`}
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {course.lastAccessed && (
                      <p className="text-xs text-gray-400">Last accessed: {formatDate(course.lastAccessed)}</p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
