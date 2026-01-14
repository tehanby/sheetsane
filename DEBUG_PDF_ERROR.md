# Debugging PDF Download Error

## Error Message
```
{"ok":false,"code":"INTERNAL","error":"Failed to generate report"}
```

## How to Debug

### 1. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Logs** tab
2. Filter by `/api/report/download` or look for recent errors
3. You should see logs like:
   ```
   [Report Download] Error: <actual error message>
   [Report Download] Error details: <detailed error>
   ```
4. The actual error message will help identify the issue

### 2. Common Issues

#### PDFKit Import Error
- **Symptom**: Module not found or import errors
- **Fix**: Ensure `pdfkit` and `@types/pdfkit` are installed
- **Check**: Run `npm list pdfkit` to verify installation

#### Missing Analysis Result
- **Symptom**: `result` is null or undefined
- **Fix**: Ensure analysis has completed before downloading
- **Check**: Verify `/api/analyze/` returns a result

#### Memory/Timeout Issues
- **Symptom**: Function timeout on Vercel
- **Fix**: Vercel free tier has 10-second timeout
- **Check**: Large PDFs might exceed timeout

#### Font/Encoding Issues
- **Symptom**: PDFKit crashes with font errors
- **Fix**: PDFKit should use built-in fonts by default
- **Check**: Error logs for font-related messages

### 3. Quick Fixes to Try

1. **Redeploy**: Make sure latest code is deployed
   ```bash
   git push  # Triggers Vercel deployment
   ```

2. **Check Dependencies**: Ensure all packages are installed
   ```bash
   npm install
   npm run build  # Should succeed
   ```

3. **Test Locally**: Try generating PDF locally
   ```bash
   npm run dev
   # Upload file, complete payment, try download
   ```

### 4. Expected Behavior

The code should:
1. ✅ Get analysis result (from cache or regenerate)
2. ✅ Generate PDF using PDFKit
3. ✅ Return PDF as download

If any step fails, you'll get the error.

### 5. Next Steps

1. Check Vercel logs for actual error message
2. Share the error message for further debugging
3. Try testing locally to see if it reproduces

---

**Note**: The code has been updated to remove the problematic `bufferedPageRange()` call that was causing issues. If you're still seeing errors, check the logs for the actual error message.
