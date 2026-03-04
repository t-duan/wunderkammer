export const colors = {
  graphitschwarz: '#212020',
  verkehrsweiss: '#ffffff',
  seidengruen: '#8dc9a4',
  trollingerblau: '#121f62',
  gerberarot: '#e13e13',
  zitronengelb: '#f3d548',
  loungeviolett: '#580d82',
  lichtrot: '#CB295C',
  perlrosa: '#bd544e',
  lehmbraun: '#916046',
  bambustiefgelb: '#cf964c',
} as const;

export const cssVariables = `
  :root {
    --color-graphitschwarz: ${colors.graphitschwarz};
    --color-verkehrsweiss: ${colors.verkehrsweiss};
    --color-seidengruen: ${colors.seidengruen};
    --color-trollingerblau: ${colors.trollingerblau};
    --color-gerberarot: ${colors.gerberarot};
    --color-zitronengelb: ${colors.zitronengelb};
    --color-loungeviolett: ${colors.loungeviolett};
    --color-lichtrot: ${colors.lichtrot};
    --color-perlrosa: ${colors.perlrosa};
    --color-lehmbraun: ${colors.lehmbraun};
    --color-bambustiefgelb: ${colors.bambustiefgelb};

    --font-family: 'Raleway', sans-serif;
    --font-size-body: 16px;
    --font-size-h1: 2.5rem;
    --font-size-h2: 2rem;
    --font-size-h3: 1.5rem;
    --line-height: 1.2;
  }
`;
