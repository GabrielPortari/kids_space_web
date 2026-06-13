import { describe, expect, it } from "vitest";
import {
  buildCreateChildPayload,
  sanitizeChildFormStateForPayload,
} from "../childPayload";
import type { ChildFormState } from "../types";

function createBaseChildForm(): ChildFormState {
  return {
    name: "  Maria Clara  ",
    document: "123.456.789-01",
    email: "  maria@example.com  ",
    contact: " (11) 99999-8888 ",
    birthDate: " 2026-05-21 ",
    parents: "parent-1, parent-2",
    inheritParentAddress: false,
    healthInfo: {
      dietaryRestrictions: ["  lactose  ", "", "  glúten "],
      allergies: [" poeira "],
      medications: [
        { name: "  Dipirona  ", dosage: " 10ml ", schedule: " 07:03 " },
        { name: "", dosage: "", schedule: "" },
      ],
      medicalConditions: ["  asma  "],
      fearsOrSensitivities: [" barulho ", "  "],
    },
    addressStreet: "  Rua das Flores  ",
    addressNumber: "  123  ",
    addressDistrict: " Centro ",
    addressCity: " São Paulo ",
    addressState: " SP ",
    addressZipCode: " 01001-000 ",
    addressComplement: "  Apto 5  ",
    addressCountry: "  Brasil  ",
  };
}

describe("sanitizeChildFormStateForPayload", () => {
  it("trims the base fields and health info", () => {
    const payload = sanitizeChildFormStateForPayload(createBaseChildForm());

    expect(payload).toEqual({
      name: "Maria Clara",
      document: "12345678901",
      email: "maria@example.com",
      contact: "11999998888",
      birthDate: "2026-05-21",
      healthInfo: {
        dietaryRestrictions: ["lactose", "glúten"],
        allergies: ["poeira"],
        medicalConditions: ["asma"],
        fearsOrSensitivities: ["barulho"],
        medications: [{ name: "Dipirona", dosage: "10ml", schedule: "07:03" }],
      },
    });
  });
});

describe("buildCreateChildPayload", () => {
  it("builds a sanitized create payload with inherited parent address", () => {
    const payload = buildCreateChildPayload({
      childForm: {
        ...createBaseChildForm(),
        parents: "parent-1",
        inheritParentAddress: true,
        addressStreet: "  should be ignored  ",
        addressNumber: "  999  ",
        addressDistrict: " ignored ",
        addressCity: " ignored ",
        addressState: " ignored ",
        addressZipCode: " ignored ",
        addressComplement: " ignored ",
        addressCountry: " ignored ",
      },
      parents: [
        {
          id: "parent-1",
          name: "  Responsavel 1 ",
          address: {
            address: "  Av. Central  ",
            number: " 45 ",
            neighborhood: " Centro ",
            city: " Sao Paulo ",
            state: " SP ",
            complement: " Bloco B ",
            zipcode: " 01001000 ",
            country: " Brasil ",
          },
        },
      ],
      currentCompanyScope: "company-77",
    });

    expect(payload).toEqual({
      name: "Maria Clara",
      document: "12345678901",
      email: "maria@example.com",
      contact: "11999998888",
      birthDate: "2026-05-21",
      parents: ["parent-1"],
      companyId: "company-77",
      healthInfo: {
        dietaryRestrictions: ["lactose", "glúten"],
        allergies: ["poeira"],
        medicalConditions: ["asma"],
        fearsOrSensitivities: ["barulho"],
        medications: [{ name: "Dipirona", dosage: "10ml", schedule: "07:03" }],
      },
      address: {
        address: "Av. Central",
        number: "45",
        neighborhood: "Centro",
        city: "Sao Paulo",
        state: "SP",
        complement: "Bloco B",
        zipcode: "01001000",
        country: "Brasil",
      },
    });
  });

  it("uses the child address when inheritance is disabled", () => {
    const payload = buildCreateChildPayload({
      childForm: createBaseChildForm(),
      parents: [],
      currentCompanyScope: undefined,
    });

    expect(payload.address).toEqual({
      address: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      complement: "Apto 5",
      zipcode: "01001000",
      country: "Brasil",
    });
  });
});
