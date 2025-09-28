import { useState } from "react";
import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { WalrusClient, WalrusFile, RetryableWalrusClientError } from '@mysten/walrus';
import ClipLoader from "react-spinners/ClipLoader";

export function WalrusBasicTest() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [testContent, setTestContent] = useState("Hello from Walrus Basic Test!");
  const [fileId, setFileId] = useState<string | null>(null);
  const [quiltBlobId, setQuiltBlobId] = useState<string | null>(null);
  const [manualFileId, setManualFileId] = useState<string>("");
  const [retrievedContent, setRetrievedContent] = useState<string | null>(null);
  const [rawBytes, setRawBytes] = useState<number[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleUpload = async () => {
    if (!currentAccount) {
      setError("Please connect your wallet first");
      return;
    }

    setIsUploading(true);
    setError(null);
    setDebugInfo("");

    try {
      console.log('🚀 Starting Walrus basic upload test...');
      setDebugInfo("Initializing Walrus client...");
      
      // Initialize Walrus client with explicit WASM URL
      const walrusClient = new WalrusClient({
        network: 'testnet',
        suiClient: new SuiClient({
          url: getFullnodeUrl('testnet'),
        }),
        wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
      });

      console.log('📤 Creating WalrusFile...');
      setDebugInfo("Creating WalrusFile...");
      
      // Create a WalrusFile from the test content (根据官方文档)
      const file = WalrusFile.from({
        contents: new TextEncoder().encode(testContent),
        identifier: 'basic-test-file.txt',
        tags: {
          'content-type': 'text/plain',
        },
      });
      
      console.log('📄 Created WalrusFile:', file);
      // 注意：identifier和tags需要通过方法获取，不是直接属性
      console.log('📄 File created successfully');

      console.log('🔄 Starting writeFilesFlow...');
      setDebugInfo("Starting writeFilesFlow...");
      
      // Use the browser-friendly writeFilesFlow
      const flow = walrusClient.writeFilesFlow({
        files: [file],
      });

      console.log('🔧 Encoding files...');
      setDebugInfo("Encoding files...");
      await flow.encode();

      console.log('📝 Registering blob on-chain...');
      setDebugInfo("Registering blob on-chain...");
      
      const registerTx = flow.register({
        epochs: 3,
        owner: currentAccount.address,
        deletable: true,
      });

      // Execute registration transaction
      const registerResult = await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: (result) => {
              console.log('✅ Registration successful:', result);
              console.log('Registration result type:', typeof result);
              console.log('Registration result keys:', result ? Object.keys(result) : 'result is null/undefined');
              if (result && result.digest) {
                console.log('Registration digest:', result.digest);
              } else {
                console.log('Registration result does not have digest property');
              }
              setDebugInfo("Registration successful");
              resolve(result);
            },
            onError: (error) => {
              console.error('❌ Registration failed:', error);
              setDebugInfo(`Registration failed: ${error.message}`);
              reject(error);
            },
          }
        );
      });

      // Check if registration was successful
      if (!registerResult || !(registerResult as any).digest) {
        throw new Error('Registration failed: No digest returned');
      }

      console.log('📤 Uploading data to storage nodes...');
      setDebugInfo("Uploading data to storage nodes...");
      
      try {
        await flow.upload({ digest: (registerResult as any).digest });
        console.log('✅ Upload completed successfully');
      } catch (uploadError: any) {
        console.error('❌ Upload failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError?.message || 'Unknown error',
          stack: uploadError?.stack || 'No stack trace',
          name: uploadError?.name || 'Unknown error type'
        });
        throw new Error(`Upload failed: ${uploadError?.message || 'Unknown error'}`);
      }

      console.log('✅ Certifying blob availability...');
      setDebugInfo("Certifying blob availability...");
      
      const certifyTx = flow.certify();
      
      // Execute certification transaction
      const certifyResult = await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: (result) => {
              console.log('✅ Certification successful:', result);
              console.log('Certification result type:', typeof result);
              console.log('Certification result keys:', result ? Object.keys(result) : 'result is null/undefined');
              if (result && result.digest) {
                console.log('Certification digest:', result.digest);
              } else {
                console.log('Certification result does not have digest property');
              }
              setDebugInfo("Certification successful");
              resolve(result);
            },
            onError: (error) => {
              console.error('❌ Certification failed:', error);
              setDebugInfo(`Certification failed: ${error.message}`);
              reject(error);
            },
          }
        );
      });

      // Check if certification was successful
      if (!certifyResult || !(certifyResult as any).digest) {
        throw new Error('Certification failed: No digest returned');
      }

      console.log('📋 Getting file list...');
      setDebugInfo("Getting file list...");
      const files = await flow.listFiles();
      
      if (files.length > 0) {
        // 分别保存文件ID和quilt blob ID
        setFileId(files[0].id);
        setQuiltBlobId(files[0].blobId);
        console.log('✅ Upload complete!');
        console.log('📄 File ID (for reading content):', files[0].id);
        console.log('📦 Quilt Blob ID (container):', files[0].blobId);
        setDebugInfo("Upload complete! Use File ID for reading content.");
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Upload failed: ${errorMessage}`);
      setDebugInfo(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRead = async () => {
    const targetFileId = manualFileId.trim() || fileId;
    
    if (!targetFileId) {
      setError("No file ID available. Please upload first or enter a file ID manually.");
      return;
    }

    setIsReading(true);
    setError(null);
    setDebugInfo("");

    try {
      console.log('📖 Reading from Walrus with file ID:', targetFileId);
      setDebugInfo("Initializing Walrus client for reading...");
      
      // Initialize Walrus client for reading (根据官方文档添加错误处理)
      const walrusClient = new WalrusClient({
        network: 'testnet',
        suiClient: new SuiClient({
          url: getFullnodeUrl('testnet'),
        }),
        wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
        storageNodeClientOptions: {
          onError: (error) => {
            console.log('🌐 Storage node error:', error);
          },
          timeout: 60_000, // 60秒超时
        },
      });

      console.log('📖 Reading file from Walrus...');
      setDebugInfo("Reading file from Walrus...");
      
      // Read the file from Walrus using file ID (not blob ID)
      const files = await walrusClient.getFiles({ ids: [targetFileId] });
      
      if (files.length > 0) {
        const file = files[0];
        console.log('📄 File object:', file);
        console.log('📄 File properties:', Object.keys(file));
        
        let content = '';
        
        try {
          // 根据官方文档，WalrusFile提供了标准的API方法
          console.log('🔍 WalrusFile object:', file);
          console.log('🔍 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(file)));
          
          // 优先使用官方推荐的API方法
          if (typeof file.text === 'function') {
            content = await file.text();
            console.log('✅ Using file.text():', content);
          } else if (typeof file.bytes === 'function') {
            const bytes = await file.bytes();
            const bytesArray = Array.from(bytes) as number[];
            console.log('🔍 Raw bytes:', bytesArray.slice(0, 20), '...');
            setRawBytes(bytesArray);
            content = new TextDecoder('utf-8').decode(bytes);
            console.log('✅ Using file.bytes() + TextDecoder:', content);
          } else {
            // 备用方案：尝试访问内部属性
            const fileAny = file as any;
            console.log('🔍 Fallback - File object structure:');
            console.log('- file.text:', typeof fileAny.text, fileAny.text);
            console.log('- file.bytes:', typeof fileAny.bytes, fileAny.bytes);
            console.log('- file.contents:', typeof fileAny.contents, fileAny.contents);
            console.log('- file.data:', typeof fileAny.data, fileAny.data);
            
            if (fileAny.contents instanceof Uint8Array) {
              const bytes = Array.from(fileAny.contents) as number[];
              console.log('🔍 Raw contents bytes:', bytes.slice(0, 20), '...');
              setRawBytes(bytes);
              content = new TextDecoder('utf-8').decode(fileAny.contents);
              console.log('✅ Using file.contents + TextDecoder:', content);
            } else if (fileAny.data instanceof Uint8Array) {
              const bytes = Array.from(fileAny.data) as number[];
              console.log('🔍 Raw data bytes:', bytes.slice(0, 20), '...');
              setRawBytes(bytes);
              content = new TextDecoder('utf-8').decode(fileAny.data);
              console.log('✅ Using file.data + TextDecoder:', content);
            } else if (typeof fileAny.text === 'string') {
              content = fileAny.text;
              console.log('✅ Using file.text as string:', content);
            } else {
              // 最后尝试：直接转换为字符串
              content = String(fileAny);
              console.log('✅ Using String(file):', content);
            }
          }
          
          setRetrievedContent(content);
          console.log('✅ Final content:', content);
          
          // 尝试获取文件的identifier和tags（根据官方文档）
          try {
            if (typeof file.getIdentifier === 'function') {
              const identifier = await file.getIdentifier();
              console.log('📄 File identifier:', identifier);
            }
            if (typeof file.getTags === 'function') {
              const tags = await file.getTags();
              console.log('📄 File tags:', tags);
            }
          } catch (metaError) {
            console.log('ℹ️ Could not get file metadata:', metaError);
          }
          
          setDebugInfo("Read successful!");
          
        } catch (decodeError) {
          console.error('❌ Decode error:', decodeError);
          setError(`Failed to decode content: ${decodeError instanceof Error ? decodeError.message : 'Unknown decode error'}`);
          setDebugInfo(`Decode error: ${decodeError instanceof Error ? decodeError.message : 'Unknown error'}`);
        }
      } else {
        setError("No file found with the given blob ID");
        setDebugInfo("No file found");
      }
      
    } catch (error) {
      console.error('❌ Read failed:', error);
      
      // 根据官方文档处理可重试的错误
      if (error instanceof RetryableWalrusClientError) {
        console.log('🔄 Retryable error detected, please try again...');
        setError(`Read failed (retryable): ${error.message}. Please try again.`);
        setDebugInfo(`Retryable error: ${error.message}. This error can be retried.`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Read failed: ${errorMessage}`);
        setDebugInfo(`Read error: ${errorMessage}`);
      }
    } finally {
      setIsReading(false);
    }
  };

  return (
    <Card style={{ padding: '16px', margin: '8px 0' }}>
      <Heading size="3" mb="3">🧪 Walrus Upload & Read Test</Heading>
      
      <Flex direction="column" gap="3">
        <div>
          <Text size="2" weight="bold" mb="2">Test Content:</Text>
          <TextField.Root
            placeholder="Enter test content"
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
          />
        </div>

        <Flex gap="2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !currentAccount}
          >
            {isUploading ? <ClipLoader size={16} /> : "📤 Upload to Walrus"}
          </Button>
          
          <Button
            onClick={handleRead}
            disabled={isReading || (!fileId && !manualFileId.trim())}
            variant="outline"
          >
            {isReading ? <ClipLoader size={16} /> : "📖 Read from Walrus"}
          </Button>
        </Flex>

        <div>
          <Text size="2" weight="bold" mb="2">Manual File ID (Optional):</Text>
          <Text size="1" color="gray" mb="2">
            Enter a file ID to read content from Walrus, or leave empty to use the uploaded file ID.
            <br />
            <strong>Note:</strong> Use file ID (not quilt blob ID) to read text content directly.
          </Text>
          <TextField.Root
            placeholder="Enter file ID to read content"
            value={manualFileId}
            onChange={(e) => setManualFileId(e.target.value)}
          />
        </div>

        {debugInfo && (
          <div>
            <Text size="2" weight="bold" color="blue">🔄 Debug Info:</Text>
            <Text size="1" style={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'var(--gray-2)', 
              padding: '8px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap'
            }}>
              {debugInfo}
            </Text>
          </div>
        )}

        {fileId && (
          <div>
            <Text size="2" weight="bold" color="green">✅ Uploaded File IDs:</Text>
            
            <div style={{ marginBottom: '8px' }}>
              <Text size="1" weight="bold" color="blue">📄 File ID (for reading content):</Text>
              <Text size="1" style={{ 
                fontFamily: 'monospace', 
                wordBreak: 'break-all',
                backgroundColor: 'var(--blue-2)',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--blue-6)',
                display: 'block',
                marginTop: '4px'
              }}>
                {fileId}
              </Text>
              <Button
                size="1"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(fileId);
                  setDebugInfo("File ID copied to clipboard!");
                }}
                style={{ marginTop: '4px' }}
              >
                📋 Copy File ID
              </Button>
            </div>

            {quiltBlobId && (
              <div>
                <Text size="1" weight="bold" color="purple">📦 Quilt Blob ID (container):</Text>
                <Text size="1" style={{ 
                  fontFamily: 'monospace', 
                  wordBreak: 'break-all',
                  backgroundColor: 'var(--purple-2)',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--purple-6)',
                  display: 'block',
                  marginTop: '4px'
                }}>
                  {quiltBlobId}
                </Text>
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(quiltBlobId);
                    setDebugInfo("Quilt Blob ID copied to clipboard!");
                  }}
                  style={{ marginTop: '4px' }}
                >
                  📋 Copy Quilt Blob ID
                </Button>
              </div>
            )}
          </div>
        )}

        {retrievedContent && (
          <div>
            <Text size="2" weight="bold" color="blue">📖 Retrieved Content:</Text>
            <Text size="1" style={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'var(--blue-2)', 
              padding: '8px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--blue-6)',
              minHeight: '60px'
            }}>
              {retrievedContent}
            </Text>
            <Flex gap="2" mt="2">
              <Button
                size="1"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(retrievedContent);
                  setDebugInfo("Content copied to clipboard!");
                }}
              >
                📋 Copy Content
              </Button>
              <Button
                size="1"
                variant="ghost"
                onClick={() => setRetrievedContent(null)}
              >
                🗑️ Clear
              </Button>
            </Flex>
          </div>
        )}

        {rawBytes && (
          <div>
            <Text size="2" weight="bold" color="purple">🔍 Raw Bytes (Debug):</Text>
            <Text size="1" style={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'var(--purple-2)', 
              padding: '8px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--purple-6)',
              fontSize: '10px'
            }}>
              {rawBytes.slice(0, 100).join(', ')}{rawBytes.length > 100 ? '...' : ''}
              {'\n\nLength: ' + rawBytes.length + ' bytes'}
            </Text>
            <Button
              size="1"
              variant="ghost"
              onClick={() => setRawBytes(null)}
              style={{ marginTop: '4px' }}
            >
              🗑️ Clear Debug Info
            </Button>
          </div>
        )}

        {error && (
          <div>
            <Text size="2" weight="bold" color="red">❌ Error:</Text>
            <Text size="1" color="red">{error}</Text>
          </div>
        )}

        <Text size="1" color="gray">
          This test panel allows you to upload content to Walrus and retrieve it using blob IDs. 
          You can either upload new content or enter an existing blob ID to read content from Walrus.
        </Text>
      </Flex>
    </Card>
  );
}
