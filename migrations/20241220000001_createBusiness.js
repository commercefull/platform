/**
 * Business table was moved to 20240805000310_createBusiness.js
 * to resolve FK ordering. This migration is intentionally a no-op.
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) { return Promise.resolve(); };
exports.down = function (knex) { return Promise.resolve(); };
