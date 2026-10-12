import { createRouter, createWebHistory } from 'vue-router'
import { ensureSession, user } from '@/lib/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/AuthView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/AuthView.vue'),
      meta: { guest: true },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/views/ChangePasswordView.vue'),
      meta: { auth: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { role: 'reader' },
    },
    {
      path: '/books',
      name: 'books',
      component: () => import('@/views/BooksView.vue'),
      meta: { role: 'reader' },
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: () => import('@/views/BookDetailView.vue'),
      meta: { role: 'reader' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { role: 'reader' },
    },
    {
      path: '/loans',
      name: 'loans',
      component: () => import('@/views/LoansView.vue'),
      meta: { role: 'reader' },
    },
    {
      path: '/read/:id',
      name: 'read',
      component: () => import('@/views/ReadView.vue'),
      meta: { role: 'reader' },
    },
    {
      path: '/admin',
      name: 'admin-home',
      component: () => import('@/views/AdminDashboardView.vue'),
      meta: { role: 'admin' },
    },
    {
      path: '/admin/books',
      name: 'admin-books',
      component: () => import('@/views/AdminBooksView.vue'),
      meta: { role: 'admin' },
    },
    {
      path: '/admin/loans',
      name: 'admin-loans',
      component: () => import('@/views/AdminLoansView.vue'),
      meta: { role: 'admin' },
    },
    {
      path: '/admin/carousel',
      name: 'admin-carousel',
      component: () => import('@/views/AdminCarouselView.vue'),
      meta: { role: 'admin' },
    },
    {
      path: '/admin/announcements',
      name: 'admin-announcements',
      component: () => import('@/views/AdminAnnouncementsView.vue'),
      meta: { role: 'admin' },
    },
    {
      path: '/admin/accounts',
      name: 'admin-accounts',
      component: () => import('@/views/AdminAccountsView.vue'),
      meta: { role: 'admin' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.guest) {
    if (await ensureSession())
      return user.value.must_change_password
        ? '/change-password'
        : user.value.role === 'admin'
          ? '/admin'
          : '/'
    return true
  }
  const current = await ensureSession()
  if (!current) return { name: 'login', query: { redirect: to.fullPath } }
  if (current.must_change_password && to.name !== 'change-password') return '/change-password'
  if (to.meta.role && to.meta.role !== current.role)
    return current.role === 'admin' ? '/admin' : '/'
  return true
})

export default router
