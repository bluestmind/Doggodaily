/**
 * Translation utilities for dynamic content
 */

/**
 * Translate dynamic content based on current language
 * @param {string} content - The content to translate
 * @param {string} currentLanguage - Current language code ('en' or 'it')
 * @param {Object} translations - Translation object
 * @returns {string} - Translated content or original content if no translation available
 */
export const translateDynamicContent = (content, currentLanguage, translations) => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // If content is already in the target language, return as is
  if (currentLanguage === 'en') {
    return content;
  }

  // For Italian, you can implement translation logic here
  // This could be:
  // 1. A mapping object for common terms
  // 2. Integration with a translation API
  // 3. A database of translations
  
  // Example: Simple keyword replacement for common terms
  const commonTranslations = {
    'en': {
      'Book': 'Libro',
      'Author': 'Autore',
      'Description': 'Descrizione',
      'Price': 'Prezzo',
      'Category': 'Categoria',
      'Tags': 'Tag',
      'Highlights': 'Punti Salienti',
      'Reviews': 'Recensioni',
      'Rating': 'Valutazione',
      'Buy Now': 'Acquista Ora',
      'Read More': 'Leggi di Più',
      'Show Less': 'Mostra Meno',
      'Preview': 'Anteprima',
      'Featured': 'In Evidenza',
      'Bestseller': 'Bestseller',
      'New Release': 'Nuova Uscita',
      'Limited Edition': 'Edizione Limitata',
      'Coming Soon': 'Prossimamente',
      'Available Now': 'Disponibile Ora',
      'General': 'Generale',
      'Fiction': 'Narrativa',
      'Non-fiction': 'Saggistica',
      'Biography': 'Biografia',
      'History': 'Storia',
      'Science': 'Scienza',
      'Technology': 'Tecnologia',
      'Business': 'Business',
      'Health': 'Salute',
      'Travel': 'Viaggi',
      'Cooking': 'Cucina',
      'Art': 'Arte',
      'Music': 'Musica',
      'Sports': 'Sport',
      'Education': 'Educazione',
      'Children': 'Bambini',
      'Teen': 'Adolescenti',
      'Adult': 'Adulti'
    }
  };

  if (currentLanguage === 'it' && commonTranslations.en) {
    let translatedContent = content;
    
    // Replace common English terms with Italian equivalents
    Object.entries(commonTranslations.en).forEach(([english, italian]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedContent = translatedContent.replace(regex, italian);
    });
    
    return translatedContent;
  }

  return content;
};

/**
 * Get translated field name for dynamic content
 * @param {string} fieldName - The field name to translate
 * @param {string} currentLanguage - Current language code
 * @param {Object} translations - Translation object
 * @returns {string} - Translated field name
 */
export const getTranslatedFieldName = (fieldName, currentLanguage, translations) => {
  const fieldTranslations = {
    'en': {
      'title': 'Title',
      'subtitle': 'Subtitle',
      'description': 'Description',
      'author': 'Author',
      'price': 'Price',
      'category': 'Category',
      'tags': 'Tags',
      'highlights': 'Highlights',
      'bio': 'Biography',
      'credentials': 'Credentials',
      'achievements': 'Achievements',
      'quote': 'Quote',
      'published_works': 'Published Works',
      'author_story': 'Author Story',
      'hero_title': 'Hero Title',
      'hero_subtitle': 'Hero Subtitle',
      'book_section_title': 'Book Section Title',
      'book_section_subtitle': 'Book Section Subtitle'
    },
    'it': {
      'title': 'Titolo',
      'subtitle': 'Sottotitolo',
      'description': 'Descrizione',
      'author': 'Autore',
      'price': 'Prezzo',
      'category': 'Categoria',
      'tags': 'Tag',
      'highlights': 'Punti Salienti',
      'bio': 'Biografia',
      'credentials': 'Credenziali',
      'achievements': 'Risultati',
      'quote': 'Citazione',
      'published_works': 'Opere Pubblicate',
      'author_story': 'Storia dell\'Autore',
      'hero_title': 'Titolo Eroe',
      'hero_subtitle': 'Sottotitolo Eroe',
      'book_section_title': 'Titolo Sezione Libri',
      'book_section_subtitle': 'Sottotitolo Sezione Libri'
    }
  };

  return fieldTranslations[currentLanguage]?.[fieldName] || fieldName;
};

/**
 * Translate book data based on current language
 * @param {Object} bookData - Book data object
 * @param {string} currentLanguage - Current language code
 * @param {Object} translations - Translation object
 * @returns {Object} - Translated book data
 */
export const translateBookData = (bookData, currentLanguage, translations) => {
  if (!bookData || currentLanguage === 'en') {
    return bookData;
  }

  const translatedData = { ...bookData };

  // Translate text fields
  const textFields = ['title', 'subtitle', 'description', 'category', 'tags'];
  textFields.forEach(field => {
    if (translatedData[field]) {
      translatedData[field] = translateDynamicContent(translatedData[field], currentLanguage, translations);
    }
  });

  // Translate highlights array
  if (translatedData.highlights && Array.isArray(translatedData.highlights)) {
    translatedData.highlights = translatedData.highlights.map(highlight => 
      translateDynamicContent(highlight, currentLanguage, translations)
    );
  }

  return translatedData;
};

/**
 * Translate author data based on current language
 * @param {Object} authorData - Author data object
 * @param {string} currentLanguage - Current language code
 * @param {Object} translations - Translation object
 * @returns {Object} - Translated author data
 */
export const translateAuthorData = (authorData, currentLanguage, translations) => {
  if (!authorData || currentLanguage === 'en') {
    return authorData;
  }

  const translatedData = { ...authorData };

  // Translate text fields
  const textFields = ['name', 'title', 'bio', 'quote', 'hero_title', 'hero_subtitle', 'book_section_title', 'book_section_subtitle'];
  textFields.forEach(field => {
    if (translatedData[field]) {
      translatedData[field] = translateDynamicContent(translatedData[field], currentLanguage, translations);
    }
  });

  // Translate arrays
  const arrayFields = ['credentials', 'achievements', 'published_works'];
  arrayFields.forEach(field => {
    if (translatedData[field] && Array.isArray(translatedData[field])) {
      translatedData[field] = translatedData[field].map(item => 
        translateDynamicContent(item, currentLanguage, translations)
      );
    }
  });

  return translatedData;
};

/**
 * Get language-specific fallback text
 * @param {string} key - Translation key
 * @param {string} currentLanguage - Current language code
 * @param {Object} translations - Translation object
 * @returns {string} - Fallback text
 */
export const getLanguageFallback = (key, currentLanguage, translations) => {
  const fallbacks = {
    'en': {
      'no_description': 'No description available',
      'no_bio': 'Author bio not available',
      'no_quote': 'No quote available',
      'no_credentials': 'No credentials available',
      'no_achievements': 'No achievements available',
      'no_published_works': 'No published works available',
      'general_category': 'General',
      'default_highlights': ['Great content', 'Well written', 'Highly recommended']
    },
    'it': {
      'no_description': 'Nessuna descrizione disponibile',
      'no_bio': 'Biografia dell\'autore non disponibile',
      'no_quote': 'Nessuna citazione disponibile',
      'no_credentials': 'Nessuna credenziale disponibile',
      'no_achievements': 'Nessun risultato disponibile',
      'no_published_works': 'Nessuna opera pubblicata disponibile',
      'general_category': 'Generale',
      'default_highlights': ['Contenuto eccellente', 'Ben scritto', 'Altamente raccomandato']
    }
  };

  return fallbacks[currentLanguage]?.[key] || fallbacks['en'][key] || key;
};
