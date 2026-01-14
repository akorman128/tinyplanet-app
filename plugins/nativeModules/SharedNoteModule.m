#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedNoteModule, NSObject)

RCT_EXTERN_METHOD(getSharedNote:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearSharedNote:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hasSharedNote:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
