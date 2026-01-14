import Foundation

@objc(SharedNoteModule)
class SharedNoteModule: NSObject {

    private let appGroupId = "group.com.alexkorman.tinyplanet"
    private let sharedNoteKey = "shared_note"

    @objc
    func getSharedNote(_ resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let noteDict = userDefaults.dictionary(forKey: sharedNoteKey) else {
            resolve(nil)
            return
        }

        resolve(noteDict)
    }

    @objc
    func clearSharedNote(_ resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            reject("ERROR", "Could not access App Group", nil)
            return
        }

        userDefaults.removeObject(forKey: sharedNoteKey)
        userDefaults.synchronize()
        resolve(nil)
    }

    @objc
    func hasSharedNote(_ resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            resolve(false)
            return
        }

        let hasNote = userDefaults.dictionary(forKey: sharedNoteKey) != nil
        resolve(hasNote)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
