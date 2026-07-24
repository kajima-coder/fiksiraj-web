//
//  FiksirajIAPPlugin.swift
//  App
//
//  Minimal, isolated StoreKit 2 Capacitor plugin for Fiksiraj.
//  See /app/frontend/src/lib/appleIap.js for the JS-side contract.
//
//  IMPORTANT
//  - `signed_transaction` returned to JS is ALWAYS the genuine
//    VerificationResult<Transaction>.jwsRepresentation from StoreKit 2.
//    We never return Transaction.jsonRepresentation, transactionId,
//    originalTransactionId, or the StoreKit-1 appStoreReceipt as a
//    substitute for the signed JWS.
//  - We never `finish()` a transaction from the purchase or restore
//    handlers. Finishing is done by an explicit call from JS ONLY
//    after the backend's /api/apple-iap/verify returns success.
//

import Foundation
import Capacitor
import StoreKit

@available(iOS 15.0, *)
@objc(FiksirajIAPPlugin)
public class FiksirajIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FiksirajIAPPlugin"
    public let jsName = "FiksirajIAP"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "loadProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]
    override public func load() {
        // Register the singleton listener. We do NOT auto-finish anything
        // here; we only forward sanitized transaction updates to JS so the
        // UI can react to renewals / external state changes.
        updatesTask = Task.detached { [weak self] in
            for await update in Transaction.updates {
                switch update {
                case .verified(let transaction):
                    let jws = update.jwsRepresentation
                    self?.notifyListeners("transactionUpdate", data: [
                        "verified": true,
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id),
                        "originalTransactionId": String(transaction.originalID),
                        "jwsRepresentation": jws
                    ])
                case .unverified(let transaction, let error):
                    self?.notifyListeners("transactionUpdate", data: [
                        "verified": false,
                        "productId": transaction.productID,
                        "errorMessage": String(describing: error)
                    ])
                }
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    // ---- loadProduct ---------------------------------------------------

    @objc func loadProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("MISSING_PRODUCT_ID", "productId is required")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first(where: { $0.id == productId }) else {
                    call.reject("PRODUCT_UNAVAILABLE", "Product not returned by StoreKit")
                    return
                }
                call.resolve([
                    "productId": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "displayPrice": product.displayPrice,
                    "isFamilyShareable": product.isFamilyShareable
                ])
            } catch {
                call.reject("PRODUCT_LOAD_FAILED", "\(error)")
            }
        }
    }

    // ---- purchase ------------------------------------------------------

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("MISSING_PRODUCT_ID", "productId is required")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first(where: { $0.id == productId }) else {
                    call.reject("PRODUCT_UNAVAILABLE", "Product not returned by StoreKit")
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verificationResult):
                    switch verificationResult {
                    case .verified(let transaction):
                        // NB: we DO NOT call transaction.finish() here.
                        // JS will call finishTransaction() only after the
                        // backend /api/apple-iap/verify returns success.
                        call.resolve([
                            "status": "verified",
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "originalTransactionId": String(transaction.originalID),
                            "expirationDateMs": transaction.expirationDate?
                                .timeIntervalSince1970.magnitude
                                .rounded()
                                .description ?? NSNull() as Any,
                            "environment": FiksirajIAPPlugin.environmentString(for: transaction),
                            "jwsRepresentation": verificationResult.jwsRepresentation
                        ])
                    case .unverified(_, let error):
                        // StoreKit signed the transaction but our device
                        // could not verify it locally. Do NOT expose the
                        // decoded payload — only the sanitized error.
                        call.reject("UNVERIFIED_TRANSACTION", "\(error)")
                    }
                case .userCancelled:
                    call.reject("USER_CANCELLED", "User cancelled the purchase")
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.reject("UNKNOWN_PURCHASE_RESULT", "Unknown StoreKit purchase result")
                }
            } catch StoreKitError.userCancelled {
                call.reject("USER_CANCELLED", "User cancelled the purchase")
            } catch {
                call.reject("PURCHASE_FAILED", "\(error)")
            }
        }
    }

    // ---- finishTransaction --------------------------------------------

    @objc func finishTransaction(_ call: CAPPluginCall) {
        guard let idString = call.getString("transactionId"),
              let id = UInt64(idString) else {
            call.reject("MISSING_TRANSACTION_ID", "transactionId is required")
            return
        }
        Task {
            // Locate the transaction across current + all history.
            // We intentionally only finish VERIFIED transactions.
            for await result in Transaction.all {
                if case .verified(let transaction) = result, transaction.id == id {
                    await transaction.finish()
                    call.resolve(["finished": true, "transactionId": idString])
                    return
                }
            }
            // Not finding a matching transaction is safe (idempotent).
            call.resolve(["finished": false, "transactionId": idString])
        }
    }

    // ---- restore -------------------------------------------------------

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                // Ask the App Store to refresh entitlements.
                try? await AppStore.sync()
            }
            var entitlements: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result {
                    entitlements.append([
                        "verified": true,
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id),
                        "originalTransactionId": String(transaction.originalID),
                        "expirationDateMs": transaction.expirationDate?
                            .timeIntervalSince1970.magnitude
                            .rounded()
                            .description ?? NSNull() as Any,
                        "environment": FiksirajIAPPlugin.environmentString(for: transaction),
                        "jwsRepresentation": result.jwsRepresentation
                    ])
                }
                // Unverified entitlements are intentionally skipped —
                // we never send an unverified payload to the backend.
            }
            call.resolve(["entitlements": entitlements])
        }
    }

    // ---- helpers -------------------------------------------------------

    private static func environmentString(for transaction: Transaction) -> String {
        if #available(iOS 16.0, *) {
            switch transaction.environment {
            case .production: return "Production"
            case .sandbox: return "Sandbox"
            case .xcode: return "Xcode"
            default: return "Unknown"
            }
        } else {
            // iOS 15 fallback — Transaction.environmentStringRepresentation
            // was the API before .environment landed.
            return transaction.environmentStringRepresentation
        }
    }
}
