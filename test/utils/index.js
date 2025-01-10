const loggerMockFactory = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  audit: jest.fn(),
});

const configMockFactory = (customConfig) => ({
  hostingEnvironment: {
    agentKeepAlive: {},
    env: "test-run",
    servicesUrl: "https://services.unit.test",
  },
  applications: {
    type: "static",
  },
  access: {
    type: "static",
  },
  search: {
    type: "static",
  },
  organisations: {
    type: "static",
  },
  directories: {
    type: "static",
  },
  audit: {
    type: "static",
  },
  serviceMapping: {
    type: "static",
  },
  notifications: {
    connectionString: "test",
  },
  loggerSettings: {},
  ...customConfig,
});

const getRequestMock = (customRequest = {}) => ({
  id: "correlationId",
  csrfToken: jest.fn().mockReturnValue("token"),
  accepts: jest.fn().mockReturnValue(["text/html"]),
  params: {},
  body: {},
  user: {
    sub: "user1",
    email: "user@unit.test",
  },
  userServices: {
    roles: [
      {
        code: "serviceid_serviceconfiguration",
      },
    ],
  },
  query: {},
  session: {},
  ...customRequest,
});

const getResponseMock = () => {
  const res = {
    render: jest.fn(),
    redirect: jest.fn(),
    status: jest.fn(),
    contentType: jest.fn(),
    send: jest.fn(),
    flash: jest.fn(),
    mockResetAll() {
      this.render.mockReturnValue(res);
      this.redirect.mockReturnValue(res);
      this.status.mockReturnValue(res);
      this.contentType.mockReturnValue(res);
    },
  };

  res.mockResetAll();
  return res;
};

const getPartialMock = (pathFromRoot = "", realMethods = []) => {
  const realModule = jest.requireActual(`../../${pathFromRoot}`);
  const mockedModule = Object.keys(realModule).reduce((module, methodName) => {
    module[methodName] = jest.fn();
    return module;
  }, {});

  realMethods.forEach((method) => {
    mockedModule[method] = realModule[method];
  });

  return mockedModule;
};

module.exports = {
  loggerMockFactory,
  configMockFactory,
  getRequestMock,
  getResponseMock,
  getPartialMock,
};
