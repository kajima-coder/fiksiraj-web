//
//  FiksirajIAPPlugin.m
//  App
//
//  Objective-C bridge that registers the FiksirajIAP Capacitor plugin
//  with the Capacitor bridge and exposes its Swift methods to JS.
//
//  Keep this file mechanical: NO logic, only Capacitor plugin macros.
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FiksirajIAPPlugin, "FiksirajIAP",
    CAP_PLUGIN_METHOD(loadProduct, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchase, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(finishTransaction, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restore, CAPPluginReturnPromise);
)
