export interface RegionalNavigationChild {
  id: string;
  label: string;
  href: string;
}

export interface RegionalNavigationItem {
  id: string;
  label: string;
  href: string;
  description: string;
  children?: RegionalNavigationChild[];
}

export const regionNavigation: RegionalNavigationItem[] = [
  {
    id: 'africa',
    label: 'África',
    href: '/regiones/#africa',
    description: 'Norte, Sahel, África Occidental, Central, Oriental y Austral.',
    children: [
      {
        id: 'africa-del-norte',
        label: 'África del Norte',
        href: '/focos/africa_primera_nota/#áfrica-del-norte-mediterráneo-sahara-y-mundo-árabe',
      },
      {
        id: 'africa-occidental',
        label: 'África Occidental',
        href: '/focos/africa_primera_nota/#áfrica-occidental-costas-dinámicas-y-un-sahel-fracturado',
      },
      {
        id: 'africa-central',
        label: 'África Central',
        href: '/focos/africa_primera_nota/#áfrica-central-la-paradoja-de-la-abundancia',
      },
      {
        id: 'africa-oriental-cuerno',
        label: 'África Oriental y el Cuerno',
        href: '/focos/africa_primera_nota/#áfrica-oriental-y-el-cuerno-donde-el-continente-toca-las-grandes-rutas-marítimas',
      },
      {
        id: 'africa-austral',
        label: 'África Austral',
        href: '/focos/africa_primera_nota/#áfrica-austral-minerales-industria-e-integración-regional',
      },
    ],
  },
  {
    id: 'asia',
    label: 'Asia',
    href: '/regiones/#asia',
    description: 'Asia Oriental, Meridional, Central y Sudoriental.',
  },
  {
    id: 'europa',
    label: 'Europa',
    href: '/regiones/#europa',
    description: 'Europa occidental, central, oriental, nórdica y balcánica.',
    children: [
      {
        id: 'turquia',
        label: 'Turquía',
        href: '/focos/turquia/',
      },
    ],
  },
  {
    id: 'medio-oriente',
    label: 'Medio Oriente',
    href: '/regiones/#medio-oriente',
    description: 'Levante, península arábiga, Irán y espacios transregionales.',
  },
  {
    id: 'americas',
    label: 'Américas',
    href: '/regiones/#americas',
    description: 'América del Norte, América Latina y el Caribe.',
  },
  {
    id: 'oceania',
    label: 'Oceanía',
    href: '/regiones/#oceania',
    description: 'Australia, Nueva Zelanda y el Pacífico insular.',
  },
];
