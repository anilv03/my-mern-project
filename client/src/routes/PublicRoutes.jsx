import { lazy } from 'react';
import { Route } from 'react-router-dom';

const Home = lazy(() => import('../pages/home/Home'));
const ProductListing = lazy(() => import('../pages/products/ProductListing'));
const ProductDetail = lazy(() => import('../pages/products/ProductDetail'));
const ProductSearch = lazy(() => import('../pages/products/ProductSearch'));
const Cart = lazy(() => import('../pages/cart/Cart'));
const Subscriptions = lazy(() => import('../pages/subscriptions/Subscriptions'));
const About = lazy(() => import('../pages/about/About'));
const Contact = lazy(() => import('../pages/contact/Contact'));
const FAQ = lazy(() => import('../pages/faq/FAQ'));
const Terms = lazy(() => import('../pages/terms/Terms'));
const Privacy = lazy(() => import('../pages/privacy/Privacy'));
const ShippingInfo = lazy(() => import('../pages/shipping/ShippingInfo'));
const ReturnsRefunds = lazy(() => import('../pages/returns/ReturnsRefunds'));
const HelpCenter = lazy(() => import('../pages/help/HelpCenter'));
const Careers = lazy(() => import('../pages/careers/Careers'));
const Press = lazy(() => import('../pages/press/Press'));
const Affiliates = lazy(() => import('../pages/affiliates/Affiliates'));
const CookiePolicy = lazy(() => import('../pages/cookies/CookiePolicy'));
const Categories = lazy(() => import('../pages/categories/Categories'));
const Blog = lazy(() => import('../pages/blog/Blog'));
const BlogDetail = lazy(() => import('../pages/blog/BlogDetail'));
const SellerPublic = lazy(() => import('../pages/store/SellerPublic'));
const NotFound = lazy(() => import('../pages/error/NotFound'));

const PublicRoutes = (
  <Route>
    <Route index element={<Home />} />
    <Route path="products" element={<ProductListing />} />
    <Route path="products/:slug" element={<ProductDetail />} />
    <Route path="search" element={<ProductSearch />} />
    <Route path="cart" element={<Cart />} />
    <Route path="subscriptions" element={<Subscriptions />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
    <Route path="faq" element={<FAQ />} />
    <Route path="terms" element={<Terms />} />
    <Route path="privacy" element={<Privacy />} />
    <Route path="shipping-info" element={<ShippingInfo />} />
    <Route path="returns-refunds" element={<ReturnsRefunds />} />
    <Route path="help-center" element={<HelpCenter />} />
    <Route path="careers" element={<Careers />} />
    <Route path="press" element={<Press />} />
    <Route path="affiliates" element={<Affiliates />} />
    <Route path="cookie-policy" element={<CookiePolicy />} />
    <Route path="categories" element={<Categories />} />
    <Route path="blog" element={<Blog />} />
    <Route path="blog/:slug" element={<BlogDetail />} />
    <Route path="store/:slug" element={<SellerPublic />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);

export default PublicRoutes;
