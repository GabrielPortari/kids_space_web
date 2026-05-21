import { describe, expect, it } from "vitest";
import {
  buildCollaboratorPayload,
  buildCollaboratorProfilePayload,
  buildCompanyPayload,
  buildCompanyProfilePayload,
  buildParentPayload,
  buildParentProfilePayload,
} from "../formPayloads";
import type {
  CollaboratorFormState,
  CompanyFormState,
  ParentFormState,
} from "../types";

function baseCompanyForm(): CompanyFormState {
  return {
    name: "  Kids Space  ",
    legalName: "  Kids Space LTDA  ",
    cnpj: "12.345.678/0001-90",
    contact: " (11) 98888-7777 ",
    email: " contato@kids.com ",
    addressStreet: " Rua A ",
    addressNumber: " 10 ",
    addressDistrict: " Centro ",
    addressCity: " São Paulo ",
    addressState: " SP ",
    addressZipCode: " 01001-000 ",
    addressComplement: " Sala 2 ",
    addressCountry: " Brasil ",
  };
}

function baseCollaboratorForm(): CollaboratorFormState {
  return {
    name: "  Ana Souza  ",
    email: " ana@exemplo.com ",
    document: "123.456.789-01",
    contact: " (11) 97777-6666 ",
    birthDate: " 2020-01-02 ",
    addressStreet: " Rua B ",
    addressNumber: " 20 ",
    addressDistrict: " Bairro ",
    addressCity: " Campinas ",
    addressState: " SP ",
    addressZipCode: " 13010-000 ",
    addressComplement: " Ap 1 ",
    addressCountry: " Brasil ",
  };
}

function baseParentForm(): ParentFormState {
  return {
    name: "  Joao Responsavel  ",
    document: "123.456.789-01",
    email: " joao@exemplo.com ",
    contact: " (11) 96666-5555 ",
    birthDate: " 1980-03-04 ",
    children: " child-1, child-2 ",
    addressStreet: " Rua C ",
    addressNumber: " 30 ",
    addressDistrict: " Centro ",
    addressCity: " Rio de Janeiro ",
    addressState: " RJ ",
    addressZipCode: " 22010-000 ",
    addressComplement: " Casa 4 ",
    addressCountry: " Brasil ",
  };
}

describe("buildCompanyPayload", () => {
  it("sanitizes company create/update payload", () => {
    expect(buildCompanyPayload(baseCompanyForm())).toEqual({
      name: "Kids Space",
      legalName: "Kids Space LTDA",
      cnpj: "12345678000190",
      contact: "11988887777",
      email: "contato@kids.com",
      address: {
        address: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        complement: "Sala 2",
        zipcode: "01001000",
        country: "Brasil",
      },
    });
  });
});

describe("buildCollaboratorPayload", () => {
  it("sanitizes collaborator payload and keeps company scope", () => {
    expect(
      buildCollaboratorPayload(baseCollaboratorForm(), "company-1"),
    ).toEqual({
      name: "Ana Souza",
      email: "ana@exemplo.com",
      document: "12345678901",
      contact: "11977776666",
      birthDate: "2020-01-02",
      companyId: "company-1",
      address: {
        address: "Rua B",
        number: "20",
        neighborhood: "Bairro",
        city: "Campinas",
        state: "SP",
        complement: "Ap 1",
        zipcode: "13010000",
        country: "Brasil",
      },
    });
  });
});

describe("buildParentPayload", () => {
  it("sanitizes parent payload and parses linked children", () => {
    expect(buildParentPayload(baseParentForm(), "company-1")).toEqual({
      name: "Joao Responsavel",
      document: "12345678901",
      email: "joao@exemplo.com",
      contact: "11966665555",
      birthDate: "1980-03-04",
      companyId: "company-1",
      children: ["child-1", "child-2"],
      address: {
        address: "Rua C",
        number: "30",
        neighborhood: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        complement: "Casa 4",
        zipcode: "22010000",
        country: "Brasil",
      },
    });
  });
});

describe("profile payload builders", () => {
  it("sanitizes company profile payload", () => {
    expect(
      buildCompanyProfilePayload({
        name: "  Kids Space  ",
        legalName: "  Kids Space LTDA  ",
        contact: " (11) 98888-7777 ",
        email: "  contato@kids.com  ",
        logoUrl: " https://img.example/logo.png ",
        website: " https://kids.com ",
        "address.street": " Rua A ",
        "address.number": " 10 ",
        "address.neighborhood": " Centro ",
        "address.city": " São Paulo ",
        "address.state": " SP ",
        "address.zipCode": " 01001-000 ",
        "address.complement": " Sala 2 ",
        "address.country": " Brasil ",
      }),
    ).toEqual({
      name: "Kids Space",
      legalName: "Kids Space LTDA",
      contact: "11988887777",
      email: "contato@kids.com",
      logoUrl: "https://img.example/logo.png",
      website: "https://kids.com",
      address: {
        address: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        complement: "Sala 2",
        zipcode: "01001000",
        country: "Brasil",
      },
    });
  });

  it("sanitizes collaborator profile payload", () => {
    expect(
      buildCollaboratorProfilePayload({
        name: " Ana Souza ",
        contact: " (11) 97777-6666 ",
        "address.street": " Rua B ",
        "address.number": " 20 ",
        "address.neighborhood": " Bairro ",
        "address.city": " Campinas ",
        "address.state": " SP ",
        "address.zipCode": " 13010-000 ",
        "address.complement": " Ap 1 ",
        "address.country": " Brasil ",
      }),
    ).toEqual({
      name: "Ana Souza",
      contact: "11977776666",
      address: {
        address: "Rua B",
        number: "20",
        neighborhood: "Bairro",
        city: "Campinas",
        state: "SP",
        complement: "Ap 1",
        zipcode: "13010000",
        country: "Brasil",
      },
    });
  });

  it("sanitizes parent profile payload", () => {
    expect(
      buildParentProfilePayload({
        name: " Joao Responsavel ",
        contact: " (11) 96666-5555 ",
        "address.street": " Rua C ",
        "address.number": " 30 ",
        "address.neighborhood": " Centro ",
        "address.city": " Rio de Janeiro ",
        "address.state": " RJ ",
        "address.zipCode": " 22010-000 ",
        "address.complement": " Casa 4 ",
        "address.country": " Brasil ",
      }),
    ).toEqual({
      name: "Joao Responsavel",
      contact: "11966665555",
      address: {
        address: "Rua C",
        number: "30",
        neighborhood: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        complement: "Casa 4",
        zipcode: "22010000",
        country: "Brasil",
      },
    });
  });
});
