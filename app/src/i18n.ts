import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  de: {
    translation: {
      app_title: 'Wunderkammer Gotha',
      map: 'Karte',
      list: 'Liste',
      back: 'Zurück',
      loading: 'Laden...',
      error_loading: 'Fehler beim Laden',
      no_description: 'Keine Beschreibung verfügbar.',
      read_more_wikipedia: 'Weiterlesen auf Wikipedia',
      images: 'Bilder',
      factgrid_info: 'FactGrid-Informationen',
      view_on_factgrid: 'Auf FactGrid ansehen',
      view_on_wikidata: 'Auf Wikidata ansehen',
      pois_title: 'Sehenswürdigkeiten',
      wikidata_statements: 'Wikidata-Aussagen',
      factgrid_statements: 'FactGrid-Aussagen',
      pageviews_title: 'Wikipedia-Seitenaufrufe (90 Tage)',
      pageviews_total: 'Gesamt',
      pageviews_avg: 'Ø / Tag',
      language: 'EN',
    },
  },
  en: {
    translation: {
      app_title: 'Wunderkammer Gotha',
      map: 'Map',
      list: 'List',
      back: 'Back',
      loading: 'Loading...',
      error_loading: 'Error loading data',
      no_description: 'No description available.',
      read_more_wikipedia: 'Read more on Wikipedia',
      images: 'Images',
      factgrid_info: 'FactGrid Information',
      view_on_factgrid: 'View on FactGrid',
      view_on_wikidata: 'View on Wikidata',
      pois_title: 'Points of Interest',
      wikidata_statements: 'Wikidata Statements',
      factgrid_statements: 'FactGrid Statements',
      pageviews_title: 'Wikipedia Pageviews (90 days)',
      pageviews_total: 'Total',
      pageviews_avg: 'Avg / day',
      language: 'DE',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'de',
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
});

export default i18n;
