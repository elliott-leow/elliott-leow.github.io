import AVFoundation
import AppKit

// usage: encode <frames dir> <out> <fps> <bits per second, or 0 for HEVC with alpha at a fixed quality>
let args = CommandLine.arguments
let dir = URL(fileURLWithPath: args[1])
let out = URL(fileURLWithPath: args[2])
let fps = Int32(args[3])!
let bitrate = Int(args[4])!
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasSuffix(".png") }.sorted()
let first = NSImage(contentsOf: dir.appendingPathComponent(files[0]))!
let rep = first.representations[0]
let w = rep.pixelsWide, h = rep.pixelsHigh
try? FileManager.default.removeItem(at: out)
let alpha = bitrate == 0
let writer = try AVAssetWriter(outputURL: out, fileType: alpha ? .mov : .mp4)
let compression: [String: Any] = alpha
  ? [AVVideoQualityKey: 0.92, "TargetQualityForAlpha": 0.92, AVVideoMaxKeyFrameIntervalKey: 600, AVVideoAllowFrameReorderingKey: false]
  : [AVVideoAverageBitRateKey: bitrate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel, AVVideoMaxKeyFrameIntervalKey: 600, AVVideoAllowFrameReorderingKey: false]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: alpha ? AVVideoCodecType.hevcWithAlpha : AVVideoCodecType.h264,
  AVVideoWidthKey: w, AVVideoHeightKey: h,
  AVVideoColorPropertiesKey: [
    AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
    AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
    AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
  ],
  AVVideoCompressionPropertiesKey: compression,
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)
for (i, f) in files.enumerated() {
  while !input.isReadyForMoreMediaData { usleep(1000) }
  let img = NSImage(contentsOf: dir.appendingPathComponent(f))!
  var rect = CGRect(x: 0, y: 0, width: w, height: h)
  let cg = img.cgImage(forProposedRect: &rect, context: nil, hints: nil)!
  var pb: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
  let buf = pb!
  CVPixelBufferLockBaseAddress(buf, [])
  let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: w, height: h, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  ctx.clear(rect)
  ctx.draw(cg, in: rect)
  CVPixelBufferUnlockBaseAddress(buf, [])
  adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
print(writer.status == .completed ? "ok \(w)x\(h) \(files.count) frames" : "failed \(String(describing: writer.error))")
