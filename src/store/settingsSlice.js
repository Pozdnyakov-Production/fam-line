import { createSlice } from '@reduxjs/toolkit';

const defaultMenu = ['home', 'tasks', 'calendar', 'bank', 'profile', 'chat', 'search', 'settings'];
const defaultWidgets = ['familyNews', 'personalNotes'];
const defaultVisibleMenu = {
  home: true,
  tasks: true,
  chat: true,
  bank: true,
  search: true,
  calendar: true,
  family: true,
};

const initialState = {
  menuOrder: JSON.parse(localStorage.getItem('menuOrder')) || defaultMenu,
  homePage: JSON.parse(localStorage.getItem('homePageSettings')) || {
    visibleWidgets: defaultWidgets,
    widgetsOrder: defaultWidgets,
  },
  taskAutoChangeEnabled: JSON.parse(localStorage.getItem('taskAutoChange')) ?? true,
  darkMode: JSON.parse(localStorage.getItem('darkMode')) ?? false,
  customColors: JSON.parse(localStorage.getItem('customColors')) || { primary: '', secondary: '' },
  visibleMenuItems: (() => {
    const saved = localStorage.getItem('visibleMenuItems');
    if (saved) {
      return { ...defaultVisibleMenu, ...JSON.parse(saved) };
    }
    return defaultVisibleMenu;
  })(),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    reorderMenu(state, action) {
      const { from, to } = action.payload;
      const item = state.menuOrder.splice(from, 1)[0];
      state.menuOrder.splice(to, 0, item);
      localStorage.setItem('menuOrder', JSON.stringify(state.menuOrder));
    },
    setMenuOrder(state, action) {
      state.menuOrder = action.payload;
      localStorage.setItem('menuOrder', JSON.stringify(state.menuOrder));
    },
    toggleMenuItem(state, action) {
      const key = action.payload;
      state.visibleMenuItems[key] = !state.visibleMenuItems[key];
      localStorage.setItem('visibleMenuItems', JSON.stringify(state.visibleMenuItems));
    },
    updateHomeWidgets(state, action) {
      state.homePage = action.payload;
      localStorage.setItem('homePageSettings', JSON.stringify(state.homePage));
    },
    toggleTaskAutoChange(state) {
      state.taskAutoChangeEnabled = !state.taskAutoChangeEnabled;
      localStorage.setItem('taskAutoChange', state.taskAutoChangeEnabled);
    },
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setCustomColors(state, action) {
      state.customColors = action.payload;
      localStorage.setItem('customColors', JSON.stringify(state.customColors));
    },
  },
});

export const {
  reorderMenu,
  setMenuOrder,
  toggleMenuItem,
  updateHomeWidgets,
  toggleTaskAutoChange,
  toggleDarkMode,
  setCustomColors,
} = settingsSlice.actions;

export default settingsSlice.reducer;