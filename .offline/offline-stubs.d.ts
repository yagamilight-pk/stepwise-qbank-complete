declare namespace React {
  type ReactNode = any;
  type CSSProperties = Record<string, string | number | undefined>;
  type ComponentType<P = any> = (props: P) => any;
  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);
  interface RefObject<T> { current: T; }
  interface SyntheticEvent<T = Element> { currentTarget: T; target: T; preventDefault(): void; }
  interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}
  interface MouseEvent<T = Element> extends SyntheticEvent<T> {}
}

declare module "react" {
  export type ReactNode = React.ReactNode;
  export type CSSProperties = React.CSSProperties;
  export type Dispatch<A> = React.Dispatch<A>;
  export type SetStateAction<S> = React.SetStateAction<S>;
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): React.RefObject<T>;
  export interface Context<T> { Provider: React.ComponentType<{ value: T; children?: React.ReactNode }>; __type?: T }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useReducer<R extends (state: any, action: any) => any, I>(reducer: R, initialArg: I): [ReturnType<R>, React.Dispatch<Parameters<R>[1]>];
}

declare module "react/jsx-runtime" {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module "next" {
  export interface Metadata { [key: string]: any }
  export interface Viewport { [key: string]: any }
  export interface NextConfig { [key: string]: any }
}

declare module "next/link" {
  const Link: React.ComponentType<any>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): { push(href: string): void; replace(href: string): void; back(): void };
  export function usePathname(): string;
}

declare module "lucide-react" {
  export type LucideIcon = React.ComponentType<any>;
  export const Activity: LucideIcon; export const AlarmClock: LucideIcon; export const AlertTriangle: LucideIcon;
  export const Archive: LucideIcon; export const ArrowLeft: LucideIcon; export const ArrowRight: LucideIcon;
  export const BarChart3: LucideIcon; export const Bell: LucideIcon; export const BookCheck: LucideIcon;
  export const BookOpen: LucideIcon; export const BookOpenCheck: LucideIcon; export const Bookmark: LucideIcon;
  export const BookmarkCheck: LucideIcon; export const BrainCircuit: LucideIcon; export const Calculator: LucideIcon;
  export const Calendar: LucideIcon; export const CalendarDays: LucideIcon; export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon; export const ChevronDown: LucideIcon; export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon; export const CircleAlert: LucideIcon; export const CircleDollarSign: LucideIcon;
  export const CircleHelp: LucideIcon; export const Clock3: LucideIcon; export const Command: LucideIcon;
  export const Copy: LucideIcon; export const CreditCard: LucideIcon; export const Download: LucideIcon;
  export const Edit3: LucideIcon; export const Eye: LucideIcon; export const EyeOff: LucideIcon;
  export const FileCheck2: LucideIcon; export const FilePlus2: LucideIcon; export const FileStack: LucideIcon;
  export const FileText: LucideIcon; export const Filter: LucideIcon; export const Flag: LucideIcon;
  export const Flame: LucideIcon; export const FlaskConical: LucideIcon; export const Gauge: LucideIcon;
  export const Globe2: LucideIcon; export const GraduationCap: LucideIcon; export const Heart: LucideIcon;
  export const Highlighter: LucideIcon; export const Home: LucideIcon; export const KeyRound: LucideIcon;
  export const Layers3: LucideIcon; export const LayoutDashboard: LucideIcon; export const LibraryBig: LucideIcon;
  export const List: LucideIcon; export const ListFilter: LucideIcon; export const LockKeyhole: LucideIcon;
  export const Mail: LucideIcon; export const Menu: LucideIcon; export const MessageCircle: LucideIcon;
  export const MessageSquareText: LucideIcon; export const MoreHorizontal: LucideIcon; export const Moon: LucideIcon;
  export const NotebookPen: LucideIcon; export const PanelLeftClose: LucideIcon; export const Pause: LucideIcon;
  export const Play: LucideIcon; export const Plus: LucideIcon; export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon; export const Search: LucideIcon; export const Send: LucideIcon;
  export const Settings: LucideIcon; export const Settings2: LucideIcon; export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon; export const SlidersHorizontal: LucideIcon; export const Sparkles: LucideIcon;
  export const Star: LucideIcon; export const Stethoscope: LucideIcon; export const Sun: LucideIcon;
  export const Tag: LucideIcon; export const Target: LucideIcon; export const TimerReset: LucideIcon;
  export const Trash2: LucideIcon; export const TrendingUp: LucideIcon; export const Trophy: LucideIcon;
  export const UserCheck: LucideIcon; export const UserMinus: LucideIcon; export const UserRound: LucideIcon;
  export const Users: LucideIcon; export const WandSparkles: LucideIcon; export const X: LucideIcon;
  export const XCircle: LucideIcon; export const Zap: LucideIcon;
}

declare const process: { cwd(): string };

declare namespace JSX {
  interface IntrinsicAttributes { key?: any }
  interface IntrinsicElements { [elemName: string]: any }
}
