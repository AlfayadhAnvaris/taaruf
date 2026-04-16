import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import {
  BookOpen, Plus, Trash2, Edit3, Save, X, ChevronDown,
  PlayCircle, FileQuestion, GraduationCap, CheckCircle,
  AlertCircle, Loader, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  Activity, Zap, Upload
} from 'lucide-react';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const CARD = { borderRadius: '14px', border: '1px solid var(--border)', background: 'white', padding: '1.25rem 1.5rem', marginBottom: '1rem' };
const BTN_SM = (extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem',
  fontWeight: '700', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
  ...extra
});
