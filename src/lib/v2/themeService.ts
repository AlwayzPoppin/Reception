import { ThemeConfig, Season } from '../../types/v2/types';

export type ThemeMode = 'light' | 'dark';

const baseDark = {
  surfaceHex: '#1e293b',    // slate-800
  borderHex: '#334155',     // slate-700
  textPrimaryHex: '#f8fafc', // slate-50
  textSecondaryHex: '#94a3b8' // slate-400
};

const baseLight = {
  surfaceHex: '#ffffff',
  borderHex: '#f1f5f9',     // slate-100
  textPrimaryHex: '#0f172a', // slate-900
  textSecondaryHex: '#64748b' // slate-500
};

export const themes: Record<Season, { light: ThemeConfig, dark: ThemeConfig }> = {
  winter: {
    light: {
      id: 'winter', name: 'Winter Frost', primary: 'indigo-600', primaryHex: '#4f46e5', secondary: 'slate-900',
      bgGradient: 'from-blue-50 to-indigo-100', accent: 'blue-400', accentHex: '#60a5fa', icon: '❄️', isDark: false, ...baseLight
    },
    dark: {
      id: 'winter', name: 'Winter Frost', primary: 'indigo-500', primaryHex: '#6366f1', secondary: 'white',
      bgGradient: 'from-slate-900 to-indigo-950', accent: 'blue-400', accentHex: '#60a5fa', icon: '❄️', isDark: true, ...baseDark
    }
  },
  spring: {
    light: {
      id: 'spring', name: 'Spring Bloom', primary: 'emerald-600', primaryHex: '#059669', secondary: 'green-900',
      bgGradient: 'from-green-50 to-emerald-50', accent: 'rose-400', accentHex: '#fb7185', icon: '🌸', isDark: false, ...baseLight
    },
    dark: {
      id: 'spring', name: 'Spring Bloom', primary: 'emerald-500', primaryHex: '#10b981', secondary: 'white',
      bgGradient: 'from-slate-950 to-emerald-950', accent: 'rose-400', accentHex: '#fb7185', icon: '🌸', isDark: true, ...baseDark
    }
  },
  summer: {
    light: {
      id: 'summer', name: 'Solar Summer', primary: 'amber-600', primaryHex: '#d97706', secondary: 'orange-900',
      bgGradient: 'from-orange-50 to-yellow-100', accent: 'cyan-400', accentHex: '#22d3ee', icon: '☀️', isDark: false, ...baseLight
    },
    dark: {
      id: 'summer', name: 'Solar Summer', primary: 'amber-500', primaryHex: '#f59e0b', secondary: 'white',
      bgGradient: 'from-slate-900 to-orange-950', accent: 'cyan-400', accentHex: '#22d3ee', icon: '☀️', isDark: true, ...baseDark
    }
  },
  autumn: {
    light: {
      id: 'autumn', name: 'Autumn Harvest', primary: 'orange-700', primaryHex: '#c2410c', secondary: 'stone-900',
      bgGradient: 'from-orange-50 to-stone-100', accent: 'amber-700', accentHex: '#b45309', icon: '🍂', isDark: false, ...baseLight
    },
    dark: {
      id: 'autumn', name: 'Autumn Harvest', primary: 'orange-600', primaryHex: '#ea580c', secondary: 'white',
      bgGradient: 'from-slate-950 to-stone-900', accent: 'amber-700', accentHex: '#b45309', icon: '🍂', isDark: true, ...baseDark
    }
  },
  halloween: {
    light: {
      id: 'halloween', name: 'Spooky Season', primary: 'purple-700', primaryHex: '#7e22ce', secondary: 'black',
      bgGradient: 'from-purple-50 to-orange-100', accent: 'orange-500', accentHex: '#f97316', icon: '🎃', isDark: false, ...baseLight
    },
    dark: {
      id: 'halloween', name: 'Spooky Season', primary: 'purple-600', primaryHex: '#9333ea', secondary: 'white',
      bgGradient: 'from-black to-purple-950', accent: 'orange-500', accentHex: '#f97316', icon: '🎃', isDark: true, ...baseDark
    }
  },
  christmas: {
    light: {
      id: 'christmas', name: 'Yuletide', primary: 'red-700', primaryHex: '#b91c1c', secondary: 'green-900',
      bgGradient: 'from-red-50 to-green-100', accent: 'emerald-500', accentHex: '#10b981', icon: '🎄', isDark: false, ...baseLight
    },
    dark: {
      id: 'christmas', name: 'Yuletide', primary: 'red-600', primaryHex: '#dc2626', secondary: 'white',
      bgGradient: 'from-slate-950 to-red-950', accent: 'emerald-500', accentHex: '#10b981', icon: '🎄', isDark: true, ...baseDark
    }
  },
  newyear: {
    light: {
      id: 'newyear', name: 'Gala New Year', primary: 'slate-900', primaryHex: '#0f172a', secondary: 'yellow-600',
      bgGradient: 'from-slate-200 to-yellow-50', accent: 'yellow-500', accentHex: '#eab308', icon: '🥂', isDark: false, ...baseLight
    },
    dark: {
      id: 'newyear', name: 'Gala New Year', primary: 'slate-200', primaryHex: '#e2e8f0', secondary: 'yellow-500',
      bgGradient: 'from-slate-950 to-slate-900', accent: 'yellow-500', accentHex: '#eab308', icon: '🥂', isDark: true, ...baseDark
    }
  }
};

export const getSeasonalTheme = (mode: ThemeMode = 'light'): ThemeConfig => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  let season: Season = 'winter';

  if (month === 9 && day >= 20) season = 'halloween';
  else if (month === 11 && day >= 20 && day <= 26) season = 'christmas';
  else if (month === 11 && day >= 30 || (month === 0 && day <= 2)) season = 'newyear';
  else if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';

  return themes[season][mode];
};

export const applyThemeToRoot = (theme: ThemeConfig) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--theme-primary', theme.primaryHex);
  root.style.setProperty('--theme-accent', theme.accentHex);
  root.style.setProperty('--background', theme.isDark ? '#0f172a' : '#f8fafc');
  root.style.setProperty('--foreground', theme.textPrimaryHex);
  root.style.setProperty('--surface', theme.surfaceHex);
  root.style.setProperty('--border', theme.borderHex);
  root.style.setProperty('--text-secondary', theme.textSecondaryHex);

  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
