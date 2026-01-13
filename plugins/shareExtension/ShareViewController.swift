import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupId = "group.com.alexkorman.tinyplanet"
    private let sharedNoteKey = "shared_note"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        handleSharedContent()
    }

    private func handleSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            completeRequest()
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }

            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] (data, error) in
                        DispatchQueue.main.async {
                            if let text = data as? String {
                                self?.saveAndOpenApp(text: text)
                            } else {
                                self?.completeRequest()
                            }
                        }
                    }
                    return
                }
            }
        }
        completeRequest()
    }

    private func saveAndOpenApp(text: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            completeRequest()
            return
        }

        let sharedNote: [String: Any] = [
            "text": text,
            "timestamp": Date().timeIntervalSince1970,
            "source": "share-extension"
        ]

        userDefaults.set(sharedNote, forKey: sharedNoteKey)
        userDefaults.synchronize()

        openMainApp()
    }

    private func openMainApp() {
        guard let url = URL(string: "tinyplanet://create-list?fromShare=true") else {
            completeRequest()
            return
        }

        // Use openURL: selector to open the containing app from extension
        let selector = NSSelectorFromString("openURL:")
        var responder: UIResponder? = self

        while let currentResponder = responder {
            if currentResponder.responds(to: selector) {
                currentResponder.perform(selector, with: url)
                break
            }
            responder = currentResponder.next
        }

        // Complete after a short delay to ensure URL is processed
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.completeRequest()
        }
    }

    private func completeRequest() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
