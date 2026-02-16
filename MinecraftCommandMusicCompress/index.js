            let sensitiveWordAns = 0;
            const sensitiveWordSet = new Set([64, 604, 731, 918, 1989, 6004, 6464, 6489, 8964]);

            class CommandPair {
                constructor(volume, beat) {
                    this.volume = volume;
                    this.beat = beat;
                }
            }

            function processSensitiveWord(str) {
                let beat = parseInt(str);
                if (sensitiveWordSet.has(beat)) {
                    beat--;
                    sensitiveWordAns++;
                    return beat.toString();
                }
                return str;
            }

            let currentInputType = 'text';

            function setInputType(type) {
                currentInputType = type;
                document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
                if (type === 'text') {
                    document.querySelector('.type-btn').classList.add('active');
                    document.getElementById('fileSection').classList.add('hidden');
                    document.getElementById('commandInput').disabled = false;
                } else {
                    document.querySelectorAll('.type-btn')[1].classList.add('active');
                    document.getElementById('fileSection').classList.remove('hidden');
                    document.getElementById('commandInput').disabled = true;
                }
            }

            // 文件选择处理
            document.getElementById('fileInput').addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    document.getElementById('fileName').textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        document.getElementById('commandInput').value = e.target.result;
                    };
                    reader.readAsText(file);
                } else {
                    document.getElementById('fileName').textContent = '未选择文件';
                }
            });

            function compileMusic() {

                // 重置计数
                sensitiveWordAns = 0;

                // 获取配置
                const timeName = document.getElementById('timeScoreboard').value || 'time';
                const sensitiveEnabled = document.getElementById('sensitiveWord').checked;

                // 获取输入
                const input = document.getElementById('commandInput').value;
                const lines = input.split('\n').filter(line => line.trim() !== '');

                if (lines.length === 0) {
                    alert('请输入命令内容');
                    return;
                }

                // 数据结构：instruments[乐器][音调] = CommandPair数组
                const instruments = new Map();

                // 解析每一行
                lines.forEach(line => {
                    try {
                        // 提取time=后面的数字
                        const timePattern = new RegExp(`${timeName}=([0-9]+)`);
                        const timeMatch = line.match(timePattern);
                        if (!timeMatch) return;

                        let beat = timeMatch[1];

                        // 敏感词处理
                        if (sensitiveEnabled) {
                            beat = processSensitiveWord(beat);
                        }

                        // 提取playsound后面的乐器名
                        const playsoundMatch = line.match(/playsound\s+([^\s]+)/);
                        if (!playsoundMatch) return;
                        const instrument = playsoundMatch[1];

                        // 提取坐标后面的volume (支持~~~, ~ ~ ~, ~~6~)
                        const posPatterns = [
                            /~~~\s+([0-9.]+)/,
                            /~ ~ ~\s+([0-9.]+)/,
                            /~~6~\s+([0-9.]+)/
                        ];

                        let volume = '1';
                        for (const pattern of posPatterns) {
                            const volMatch = line.match(pattern);
                            if (volMatch) {
                                volume = volMatch[1];
                                break;
                            }
                        }

                        // 提取pitch（volume后面的数字）
                        const pitchMatch = line.match(new RegExp(volume + '\\s+([0-9.]+)'));
                        let pitch = pitchMatch ? pitchMatch[1] : '1.0';

                        // 如果pitch后面还有内容（min_volume），只取第一个数字
                        if (pitch.includes(' ')) {
                            pitch = pitch.split(' ')[0];
                        }

                        // 存入数据结构
                        if (!instruments.has(instrument)) {
                            instruments.set(instrument, new Map());
                        }

                        const pitchMap = instruments.get(instrument);
                        if (!pitchMap.has(pitch)) {
                            pitchMap.set(pitch, []);
                        }

                        pitchMap.get(pitch).push(new CommandPair(volume, beat));

                    } catch (e) {
                        console.error('解析行失败:', line, e);
                    }
                });



                // 检测元素是否存在
                const target = document.getElementById('aaabbb');

                if (!target) {
                    console.log('成功创建了输出窗口');

                    const target = document.getElementById('fuck_netease');

                    target.insertAdjacentHTML('afterend', '<section id="aaabbb" class="card output"><div class="output-section"><div class="output-header"><div class="output-title">输出结果</div><div class="output-controls"><button class="download-btn" id="downloadBtn" onclick="downloadFile()" disabled><i class="fas fa-download"></i> 下载</button><button class="copy-btn" id="copyBtn" onclick="copyToClipboard()" disabled><i class="fas fa-copy"></i> 复制</button></div></div><textarea id="outputContent" readonly></textarea><div class="info-text">处理完成后，点击下载按钮保存文件或复制按钮复制内容</div></div></section>');

                    console.log('跳过创建输出窗口，因为输出窗口已存在');
                }
            
            

                // 生成输出
                let output = '';
                for (const [instrument, pitchMap] of instruments) {
                    for (const [pitch, pairs] of pitchMap) {
                        // 生成unless条件
                        console.log('正在生成结果...');
                        const conditions = Array.from(pairs).map(p => `time=!${p.beat}`).join(',');
                        output += `execute as @a at @s unless entity @s[scores={${conditions}}] run playsound ${instrument} @s ~~~ ${pairs[0].volume} ${pitch}\n`;
                    }
                }


        }
            function downloadFile() {
                const output = document.getElementById('outputContent').value;
                if (!output) return;

                const blob = new Blob([output], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'output.mcfunction';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('成功下载')
            }

            function copyToClipboard() {
                const output = document.getElementById('outputContent').value;
                if (!output) return;

                navigator.clipboard.writeText(output).then(() => {
                    alert('已复制到剪贴板');
                    console.log('成功复制')
                }).catch(() => {
                    alert('复制失败，请手动复制');
                    console.error('复制失败')
                });
            }