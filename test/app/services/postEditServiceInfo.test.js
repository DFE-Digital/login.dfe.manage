jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("../../../src/app/services/utils");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  getPaginatedServicesRaw: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("../../utils");
const postEditServiceInfo = require("../../../src/app/services/postEditServiceInfo");
const { getUserServiceRoles } = require("../../../src/app/services/utils");
const {
  getServiceRaw,
  getPaginatedServicesRaw,
} = require("login.dfe.api-client/services");

const res = getResponseMock();

const listAllServicesResponse = {
  services: [
    {
      id: "service-1",
      name: "service one",
      description: "service description",
    },
    {
      id: "service-2",
      name: "service two",
      description: "service description two",
    },
  ],
};

describe("when getting the post edit service info page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      body: {
        name: "new-service-name",
        description: "existing-service-description",
      },
      session: {
        save: jest.fn((cb) => cb()),
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service-1",
      name: "service one",
      description: "service description",
      // Other fields would be present, but omitted for brevity
    });

    getPaginatedServicesRaw.mockReset();
    getPaginatedServicesRaw.mockReturnValue(listAllServicesResponse);

    getUserServiceRoles
      .mockReset()
      .mockReturnValue(["serviceid_serviceconfiguration"]);

    res.mockResetAll();
  });

  it("should redirect to the confirm page on success", async () => {
    await postEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("edit/confirm");
  });

  it("should redirect to the confirm page on success - only changing name", async () => {
    req.body = {
      name: "new-name-only",
      description: "service description",
    };
    await postEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("edit/confirm");
  });

  it("should redirect to the confirm page on success - only changing description", async () => {
    req.body = {
      name: "service one",
      description: "new-descripion",
    };
    await postEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("edit/confirm");
  });

  it("should display an error if the name is empty", async () => {
    req.body.name = "";
    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Enter a name",
    });
  });

  it("should display an error if the name is over 200 characters", async () => {
    req.body.name = "abcde12345".repeat(20) + "a"; // 201 characters
    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Name must be 200 characters or less",
    });
  });

  it("should display an error if the name is the same as another service", async () => {
    req.body.name = "service two";
    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Service name must be unique and cannot already exist in DfE Sign-in",
    });
  });

  it("should display an error if the description is empty", async () => {
    req.body.description = "";
    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      description: "Enter a description",
    });
  });

  it("should display an error if the description is over 400 characters", async () => {
    req.body.description = "abcde12345".repeat(40) + "a"; // 401 characters
    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      description: "Description must be 400 characters or less",
    });
  });

  it("should display an error if the name and description are the same as the original", async () => {
    req.body.name = "service one";
    req.body.description = "service description";
    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Neither the name or description is different from the original",
    });
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Something went wrong submitting data, please try again",
    });
  });
});
