export const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');

                // Target dimensions for optimal OpenGraph presentation
                const TARGET_WIDTH = 1200;
                const TARGET_HEIGHT = 630;
                const TARGET_ASPECT = TARGET_WIDTH / TARGET_HEIGHT;

                canvas.width = TARGET_WIDTH;
                canvas.height = TARGET_HEIGHT;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Fill with white background in case of transparent images
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

                const sourceAspect = img.width / img.height;

                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = img.width;
                let sourceHeight = img.height;

                // Implement "object-fit: cover" logic
                if (sourceAspect > TARGET_ASPECT) {
                    // Image is wider than target aspect
                    sourceWidth = img.height * TARGET_ASPECT;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    // Image is taller than target aspect
                    sourceHeight = img.width / TARGET_ASPECT;
                    sourceY = (img.height - sourceHeight) / 2;
                }

                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, TARGET_WIDTH, TARGET_HEIGHT
                );

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }
                        // Create a new file with the original name but .jpg extension
                        const fileName = file.name.replace(/\.[^/.]+$/, ".jpg");
                        const compressedFile = new File([blob], fileName, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    0.85 // High quality JPEG compression
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
