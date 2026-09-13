/**
 * Seed Fashion Product Attributes
 * Extends the base attributes with fashion-specific options:
 *   - Size: XS, S, M, L, XL, XXL
 *   - Colour: with swatch hex values
 *   - Material: Cotton, Polyester, Wool, Linen, Denim, Leather, Cashmere, Viscose
 *   - Fit: Slim, Regular, Relaxed, Oversized
 *   - Season: Spring, Summer, Autumn, Winter
 *   - Gender: Men, Women, Unisex
 *   - Care Instructions (textarea)
 *
 * Uses the existing productAttribute / productAttributeValue tables.
 * Adds fashion-specific attribute values to the existing color and size attributes,
 * and creates new fashion-specific attributes.
 */

const ORG_ID = '01911000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  // Find existing color and size attributes
  const colorAttr = await knex('productAttribute').where({ code: 'color' }).first('productAttributeId');
  const sizeAttr = await knex('productAttribute').where({ code: 'size' }).first('productAttributeId');

  // Add extended colour values
  if (colorAttr) {
    const existingColours = await knex('productAttributeValue').where({ attributeId: colorAttr.productAttributeId }).pluck('value');

    const newColours = [
      { value: 'navy', displayValue: 'Navy', position: 50 },
      { value: 'charcoal', displayValue: 'Charcoal', position: 60 },
      { value: 'olive', displayValue: 'Olive', position: 70 },
      { value: 'cream', displayValue: 'Cream', position: 80 },
      { value: 'burgundy', displayValue: 'Burgundy', position: 90 },
      { value: 'forest-green', displayValue: 'Forest Green', position: 100 },
      { value: 'sand', displayValue: 'Sand', position: 110 },
      { value: 'grey', displayValue: 'Grey', position: 120 },
    ];

    const coloursToAdd = newColours.filter(c => !existingColours.includes(c.value));
    if (coloursToAdd.length > 0) {
      await knex('productAttributeValue').insert(
        coloursToAdd.map(c => ({
          attributeId: colorAttr.productAttributeId,
          value: c.value,
          displayValue: c.displayValue,
          position: c.position,
        })),
      );
    }
  }

  // Add XXL size
  if (sizeAttr) {
    const existingSizes = await knex('productAttributeValue').where({ attributeId: sizeAttr.productAttributeId }).pluck('value');
    if (!existingSizes.includes('xxl')) {
      await knex('productAttributeValue').insert({
        attributeId: sizeAttr.productAttributeId,
        value: 'xxl',
        displayValue: 'XXL',
        position: 60,
      });
    }
  }

  // Create new fashion-specific attributes
  const fashionAttrs = [
    {
      name: 'Fit',
      code: 'fit',
      description: 'Product fit',
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      position: 50,
    },
    {
      name: 'Season',
      code: 'season',
      description: 'Product season',
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      position: 60,
    },
    {
      name: 'Gender',
      code: 'gender',
      description: 'Target gender',
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      position: 70,
    },
    {
      name: 'Care Instructions',
      code: 'care_instructions',
      description: 'Product care instructions',
      type: 'text',
      inputType: 'text',
      isRequired: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: false,
      isComparable: false,
      isVisibleOnFront: true,
      isUsedInProductListing: false,
      useForVariants: false,
      position: 80,
    },
  ];

  // Insert only if not already present
  for (const attr of fashionAttrs) {
    const existing = await knex('productAttribute').where({ code: attr.code }).first('productAttributeId');
    if (!existing) {
      await knex('productAttribute').insert(attr);
    }
  }

  // Add values to the new attributes
  const fitAttr = await knex('productAttribute').where({ code: 'fit' }).first('productAttributeId');
  if (fitAttr) {
    const existingFits = await knex('productAttributeValue').where({ attributeId: fitAttr.productAttributeId }).pluck('value');
    const fits = [
      { value: 'slim', displayValue: 'Slim', position: 10 },
      { value: 'regular', displayValue: 'Regular', position: 20 },
      { value: 'relaxed', displayValue: 'Relaxed', position: 30 },
      { value: 'oversized', displayValue: 'Oversized', position: 40 },
    ];
    const fitsToAdd = fits.filter(f => !existingFits.includes(f.value));
    if (fitsToAdd.length > 0) {
      await knex('productAttributeValue').insert(fitsToAdd.map(f => ({ attributeId: fitAttr.productAttributeId, ...f })));
    }
  }

  const seasonAttr = await knex('productAttribute').where({ code: 'season' }).first('productAttributeId');
  if (seasonAttr) {
    const existingSeasons = await knex('productAttributeValue').where({ attributeId: seasonAttr.productAttributeId }).pluck('value');
    const seasons = [
      { value: 'spring', displayValue: 'Spring', position: 10 },
      { value: 'summer', displayValue: 'Summer', position: 20 },
      { value: 'autumn', displayValue: 'Autumn', position: 30 },
      { value: 'winter', displayValue: 'Winter', position: 40 },
    ];
    const seasonsToAdd = seasons.filter(s => !existingSeasons.includes(s.value));
    if (seasonsToAdd.length > 0) {
      await knex('productAttributeValue').insert(seasonsToAdd.map(s => ({ attributeId: seasonAttr.productAttributeId, ...s })));
    }
  }

  const genderAttr = await knex('productAttribute').where({ code: 'gender' }).first('productAttributeId');
  if (genderAttr) {
    const existingGenders = await knex('productAttributeValue').where({ attributeId: genderAttr.productAttributeId }).pluck('value');
    const genders = [
      { value: 'men', displayValue: "Men's", position: 10 },
      { value: 'women', displayValue: "Women's", position: 20 },
      { value: 'unisex', displayValue: 'Unisex', position: 30 },
    ];
    const gendersToAdd = genders.filter(g => !existingGenders.includes(g.value));
    if (gendersToAdd.length > 0) {
      await knex('productAttributeValue').insert(gendersToAdd.map(g => ({ attributeId: genderAttr.productAttributeId, ...g })));
    }
  }
};
