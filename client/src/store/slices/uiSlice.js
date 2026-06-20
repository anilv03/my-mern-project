import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  mobileMenuOpen: false,
  cartDrawerOpen: false,
  searchOpen: false,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  theme: 'light',
  quickViewProduct: null,
  loading: {
    global: false,
    skeletons: {},
  },
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
    toggleCartDrawer: (state) => { state.cartDrawerOpen = !state.cartDrawerOpen; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
    openModal: (state, action) => {
      state.modal = { isOpen: true, type: action.payload.type, data: action.payload.data || null };
    },
    closeModal: (state) => {
      state.modal = { isOpen: false, type: null, data: null };
    },
    setQuickViewProduct: (state, action) => { state.quickViewProduct = action.payload; },
    setGlobalLoading: (state, action) => { state.loading.global = action.payload; },
    setSkeletonLoading: (state, action) => {
      state.loading.skeletons[action.payload.key] = action.payload.value;
    },
    setTheme: (state, action) => { state.theme = action.payload; },
    addToast: (state, action) => {
      state.toasts.push({ id: Date.now(), ...action.payload });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar, toggleMobileMenu, toggleCartDrawer, toggleSearch,
  openModal, closeModal, setQuickViewProduct,
  setGlobalLoading, setSkeletonLoading, setTheme,
  addToast, removeToast,
} = uiSlice.actions;

export const selectUI = (state) => state.ui;
export default uiSlice.reducer;
