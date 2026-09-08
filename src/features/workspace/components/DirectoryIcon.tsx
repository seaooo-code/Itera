import { memo } from "react";
import { AppWindowIcon } from "@phosphor-icons/react/AppWindow";
import { ArchiveIcon } from "@phosphor-icons/react/Archive";
import { BookOpenIcon } from "@phosphor-icons/react/BookOpen";
import { BookOpenTextIcon } from "@phosphor-icons/react/BookOpenText";
import { BooksIcon } from "@phosphor-icons/react/Books";
import { BracketsCurlyIcon } from "@phosphor-icons/react/BracketsCurly";
import { BracketsRoundIcon } from "@phosphor-icons/react/BracketsRound";
import { BrowserIcon } from "@phosphor-icons/react/Browser";
import { BrowsersIcon } from "@phosphor-icons/react/Browsers";
import { ChartBarIcon } from "@phosphor-icons/react/ChartBar";
import { CirclesFourIcon } from "@phosphor-icons/react/CirclesFour";
import { CirclesThreeIcon } from "@phosphor-icons/react/CirclesThree";
import { CloudIcon } from "@phosphor-icons/react/Cloud";
import { CodeBlockIcon } from "@phosphor-icons/react/CodeBlock";
import { CodeIcon } from "@phosphor-icons/react/Code";
import { CodeSimpleIcon } from "@phosphor-icons/react/CodeSimple";
import { CompassIcon } from "@phosphor-icons/react/Compass";
import { CubeFocusIcon } from "@phosphor-icons/react/CubeFocus";
import { CubeIcon } from "@phosphor-icons/react/Cube";
import { CubeTransparentIcon } from "@phosphor-icons/react/CubeTransparent";
import { DatabaseIcon } from "@phosphor-icons/react/Database";
import { DesktopTowerIcon } from "@phosphor-icons/react/DesktopTower";
import { DeviceMobileIcon } from "@phosphor-icons/react/DeviceMobile";
import { ExportIcon } from "@phosphor-icons/react/Export";
import { FadersIcon } from "@phosphor-icons/react/Faders";
import { FilmSlateIcon } from "@phosphor-icons/react/FilmSlate";
import { FlaskIcon } from "@phosphor-icons/react/Flask";
import { FolderSimpleIcon } from "@phosphor-icons/react/FolderSimple";
import { GearSixIcon } from "@phosphor-icons/react/GearSix";
import { GitBranchIcon } from "@phosphor-icons/react/GitBranch";
import { GithubLogoIcon } from "@phosphor-icons/react/GithubLogo";
import { GitlabLogoIcon } from "@phosphor-icons/react/GitlabLogo";
import { GitMergeIcon } from "@phosphor-icons/react/GitMerge";
import { GlobeHemisphereEastIcon } from "@phosphor-icons/react/GlobeHemisphereEast";
import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/GlobeHemisphereWest";
import { GlobeIcon } from "@phosphor-icons/react/Globe";
import { GlobeSimpleIcon } from "@phosphor-icons/react/GlobeSimple";
import { GraphIcon } from "@phosphor-icons/react/Graph";
import { HammerIcon } from "@phosphor-icons/react/Hammer";
import { HardDrivesIcon } from "@phosphor-icons/react/HardDrives";
import { ImageIcon } from "@phosphor-icons/react/Image";
import { ImagesIcon } from "@phosphor-icons/react/Images";
import { ImageSquareIcon } from "@phosphor-icons/react/ImageSquare";
import { KeyboardIcon } from "@phosphor-icons/react/Keyboard";
import { MapPinIcon } from "@phosphor-icons/react/MapPin";
import { PackageIcon } from "@phosphor-icons/react/Package";
import { PaintBrushIcon } from "@phosphor-icons/react/PaintBrush";
import { PaletteIcon } from "@phosphor-icons/react/Palette";
import { PathIcon } from "@phosphor-icons/react/Path";
import { PuzzlePieceIcon } from "@phosphor-icons/react/PuzzlePiece";
import { RocketIcon } from "@phosphor-icons/react/Rocket";
import { RocketLaunchIcon } from "@phosphor-icons/react/RocketLaunch";
import { SelectionIcon } from "@phosphor-icons/react/Selection";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/SlidersHorizontal";
import { StackIcon } from "@phosphor-icons/react/Stack";
import { StackMinusIcon } from "@phosphor-icons/react/StackMinus";
import { StackPlusIcon } from "@phosphor-icons/react/StackPlus";
import { StackSimpleIcon } from "@phosphor-icons/react/StackSimple";
import { TerminalIcon } from "@phosphor-icons/react/Terminal";
import { TerminalWindowIcon } from "@phosphor-icons/react/TerminalWindow";
import { TestTubeIcon } from "@phosphor-icons/react/TestTube";
import { ToolboxIcon } from "@phosphor-icons/react/Toolbox";
import { TranslateIcon } from "@phosphor-icons/react/Translate";
import { TreeStructureIcon } from "@phosphor-icons/react/TreeStructure";
import { UploadIcon } from "@phosphor-icons/react/Upload";
import { WrenchIcon } from "@phosphor-icons/react/Wrench";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

interface DirectoryIconDefinition {
  component: PhosphorIcon;
  tone: string;
}

const DEFAULT_TONE = "text-[var(--itera-color-muted)]";
const PRIMARY_TONE = "text-[var(--itera-color-primary-ink)]";
const TYPESCRIPT_TONE = "text-[var(--itera-color-icon-typescript)]";
const MARKDOWN_TONE = "text-[var(--itera-color-icon-markdown)]";
const WARNING_TONE = "text-[var(--itera-color-warning)]";

const DIRECTORY_ICONS: Record<string, DirectoryIconDefinition> = {
  src: { component: CodeIcon, tone: TYPESCRIPT_TONE },
  source: { component: CodeBlockIcon, tone: TYPESCRIPT_TONE },
  sources: { component: CodeSimpleIcon, tone: TYPESCRIPT_TONE },
  app: { component: AppWindowIcon, tone: PRIMARY_TONE },
  apps: { component: BrowsersIcon, tone: PRIMARY_TONE },
  components: { component: CirclesFourIcon, tone: PRIMARY_TONE },
  component: { component: PuzzlePieceIcon, tone: PRIMARY_TONE },
  pages: { component: BrowserIcon, tone: PRIMARY_TONE },
  routes: { component: PathIcon, tone: PRIMARY_TONE },
  router: { component: CompassIcon, tone: PRIMARY_TONE },
  api: { component: GlobeIcon, tone: PRIMARY_TONE },
  server: { component: DesktopTowerIcon, tone: PRIMARY_TONE },
  public: { component: GlobeSimpleIcon, tone: PRIMARY_TONE },
  static: { component: CloudIcon, tone: PRIMARY_TONE },
  assets: { component: ArchiveIcon, tone: MARKDOWN_TONE },
  images: { component: ImagesIcon, tone: MARKDOWN_TONE },
  image: { component: ImageIcon, tone: MARKDOWN_TONE },
  icons: { component: ImageSquareIcon, tone: MARKDOWN_TONE },
  media: { component: FilmSlateIcon, tone: MARKDOWN_TONE },
  styles: { component: PaletteIcon, tone: PRIMARY_TONE },
  style: { component: PaintBrushIcon, tone: PRIMARY_TONE },
  css: { component: BracketsCurlyIcon, tone: PRIMARY_TONE },
  themes: { component: FadersIcon, tone: PRIMARY_TONE },
  test: { component: TestTubeIcon, tone: WARNING_TONE },
  tests: { component: FlaskIcon, tone: WARNING_TONE },
  __tests__: { component: ShieldCheckIcon, tone: WARNING_TONE },
  spec: { component: SelectionIcon, tone: WARNING_TONE },
  specs: { component: ChartBarIcon, tone: WARNING_TONE },
  e2e: { component: DeviceMobileIcon, tone: WARNING_TONE },
  docs: { component: BookOpenTextIcon, tone: MARKDOWN_TONE },
  doc: { component: BookOpenIcon, tone: MARKDOWN_TONE },
  documentation: { component: BooksIcon, tone: MARKDOWN_TONE },
  config: { component: GearSixIcon, tone: DEFAULT_TONE },
  configs: { component: SlidersHorizontalIcon, tone: DEFAULT_TONE },
  configuration: { component: WrenchIcon, tone: DEFAULT_TONE },
  scripts: { component: TerminalIcon, tone: DEFAULT_TONE },
  script: { component: TerminalWindowIcon, tone: DEFAULT_TONE },
  bin: { component: HammerIcon, tone: DEFAULT_TONE },
  cli: { component: KeyboardIcon, tone: DEFAULT_TONE },
  packages: { component: PackageIcon, tone: WARNING_TONE },
  package: { component: CubeIcon, tone: WARNING_TONE },
  modules: { component: StackIcon, tone: WARNING_TONE },
  node_modules: { component: TreeStructureIcon, tone: DEFAULT_TONE },
  vendor: { component: ToolboxIcon, tone: DEFAULT_TONE },
  database: { component: DatabaseIcon, tone: PRIMARY_TONE },
  databases: { component: HardDrivesIcon, tone: PRIMARY_TONE },
  db: { component: StackSimpleIcon, tone: PRIMARY_TONE },
  migrations: { component: GitMergeIcon, tone: PRIMARY_TONE },
  locales: { component: TranslateIcon, tone: PRIMARY_TONE },
  locale: { component: GlobeHemisphereWestIcon, tone: PRIMARY_TONE },
  i18n: { component: GlobeHemisphereEastIcon, tone: PRIMARY_TONE },
  l10n: { component: MapPinIcon, tone: PRIMARY_TONE },
  types: { component: BracketsRoundIcon, tone: TYPESCRIPT_TONE },
  typings: { component: GraphIcon, tone: TYPESCRIPT_TONE },
  models: { component: CubeFocusIcon, tone: PRIMARY_TONE },
  model: { component: CubeTransparentIcon, tone: PRIMARY_TONE },
  store: { component: StackPlusIcon, tone: PRIMARY_TONE },
  stores: { component: StackMinusIcon, tone: PRIMARY_TONE },
  state: { component: CirclesThreeIcon, tone: PRIMARY_TONE },
  build: { component: RocketIcon, tone: DEFAULT_TONE },
  dist: { component: RocketLaunchIcon, tone: DEFAULT_TONE },
  output: { component: ExportIcon, tone: DEFAULT_TONE },
  out: { component: UploadIcon, tone: DEFAULT_TONE },
  ".git": { component: GitBranchIcon, tone: DEFAULT_TONE },
  ".github": { component: GithubLogoIcon, tone: DEFAULT_TONE },
  ".gitlab": { component: GitlabLogoIcon, tone: DEFAULT_TONE },
};

if (import.meta.env.DEV) {
  const iconOwners = new Map<PhosphorIcon, string>();
  for (const [directory, definition] of Object.entries(DIRECTORY_ICONS)) {
    const existingDirectory = iconOwners.get(definition.component);
    if (existingDirectory) {
      throw new Error(
        `目录图标映射重复：${existingDirectory} 和 ${directory} 使用了相同的 Phosphor 图标。`,
      );
    }
    iconOwners.set(definition.component, directory);
  }
}

export const DirectoryIcon = memo(function DirectoryIcon({ name }: { name: string }) {
  const definition = DIRECTORY_ICONS[name.toLowerCase()];
  const DirectoryIconComponent = definition?.component ?? FolderSimpleIcon;
  const tone = definition?.tone ?? DEFAULT_TONE;

  return <DirectoryIconComponent size={15} weight="regular" className={tone} aria-hidden />;
});
