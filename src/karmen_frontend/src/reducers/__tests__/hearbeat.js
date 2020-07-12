import heartbeat from "../hearbeat";

describe("heartbeat", () => {
  const originalAppRev = process.env.REACT_APP_GIT_REV;

  const buildAction = (type, version) => ({
    type,
    payload: {
      data: { version },
    },
  });

  beforeAll(() => {
    process.env.REACT_APP_GIT_REV = "test-version";
  });

  afterAll(() => {
    process.env.REACT_APP_GIT_REV = originalAppRev;
  });

  it("should set isOnline for successful heartbeat", () => {
    expect(
      heartbeat(undefined, buildAction("HEARTBEAT_SUCCEEDED", "test-version"))
    ).toMatchObject({
      isOnline: true,
    });
  });

  it("should set isOnline for unsuccesful heartbeat", () => {
    expect(
      heartbeat(undefined, buildAction("HEARTBEAT_FAILED", "test-version"))
    ).toMatchObject({
      isOnline: false,
    });
  });

  it("should set shouldUpgrade when backend API version changes", () => {
    expect(
      heartbeat(
        { isOnline: true, apiVersion: "test-version", shouldUpgrade: false },
        buildAction("HEARTBEAT_SUCCEEDED", "test-version")
      )
    ).toMatchObject({
      shouldUpgrade: false,
    });

    expect(
      heartbeat(
        { isOnline: true, apiVersion: "test-version", shouldUpgrade: false },
        buildAction("HEARTBEAT_SUCCEEDED", "test-version2")
      )
    ).toMatchObject({
      shouldUpgrade: true,
    });
  });

  it("should set shouldUpgrade when FE API version changes", () => {
    // Here, it reports shouldUpgrade as truthy due to
    // process.env.REACT_APP_GIT_REV being set to "test-version".
    expect(
      heartbeat(
        { isOnline: true, apiVersion: "test-version2", shouldUpgrade: false },
        buildAction("HEARTBEAT_SUCCEEDED", "test-version2")
      )
    ).toMatchObject({
      shouldUpgrade: true,
    });
  });

  it("should set isMaintenance when backend returns maintenance", () => {
    expect(
      heartbeat(
        { isOnline: true, apiVersion: "test-version2", isMaintenance: true },
        buildAction("HEARTBEAT_MAINTENANCE")
      )
    ).toMatchObject({
      apiVersion: "test-version2",
      isMaintenance: true,
      isOnline: true,
    });
  });
});
