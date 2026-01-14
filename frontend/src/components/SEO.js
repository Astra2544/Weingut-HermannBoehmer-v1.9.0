import { Helmet } from 'react-helmet-async';

const defaultMeta = {
  title: 'Weingut Hermann Böhmer',
  description: 'Handgemachte Marillenliköre und Edelbrände aus dem Herzen der Wachau. Seit 1952 Tradition und Qualität.',
  image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  url: 'https://weingut-boehmer.at',
  type: 'website',
};

export const SEO = ({ 
  title, 
  description, 
  image, 
  url,
  type,
  noindex = false 
}) => {
  const seo = {
    title: title ? `${title} | Weingut Hermann Böhmer` : defaultMeta.title,
    description: description || defaultMeta.description,
    image: image || defaultMeta.image,
    url: url || defaultMeta.url,
    type: type || defaultMeta.type,
  };

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={seo.type} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content="Weingut Hermann Böhmer" />
      <meta property="og:locale" content="de_AT" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

      {/* Additional */}
      <meta name="author" content="Weingut Hermann Böhmer" />
      <meta name="geo.region" content="AT-3" />
      <meta name="geo.placename" content="Dürnstein" />
      <link rel="canonical" href={seo.url} />
    </Helmet>
  );
};
