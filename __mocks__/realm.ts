// Mock for Realm database
class MockObjectId {
  toString() {
    return 'mock-object-id';
  }
}

class MockBSON {
  static ObjectId = MockObjectId;
}

class MockRealm {
  static BSON = MockBSON;
}

export default MockRealm;
