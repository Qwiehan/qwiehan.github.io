// mccmc.js - Minecraft函数解析器核心逻辑
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
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
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
            console.log('解析行失败:', line, e);
        }
    });
    
    // 生成输出
    let output = '';
    for (const [instrument, pitchMap] of instruments) {
        for (const [pitch, pairs] of pitchMap) {
            // 生成unless条件
            const conditions = Array.from(pairs).map(p => `time=!${p.beat}`).join(',');
            output += `execute as @a at @s unless entity @s[scores={${conditions}}] run playsound ${instrument} @s ~~~ ${pairs[0].volume} ${pitch}\n`;
        }
    }
    
    // 显示输出
    document.getElementById('outputContent').value = output;
    
    // 启用下载和复制按钮
    document.getElementById('downloadBtn').disabled = !output;
    document.getElementById('copyBtn').disabled = !output;
    
    // 如果有敏感词调整，显示提示
    if (sensitiveEnabled && sensitiveWordAns > 0) {
        alert(`共调整 ${sensitiveWordAns} 次敏感词`);
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
}

function copyToClipboard() {
    const output = document.getElementById('outputContent').value;
    if (!output) return;
    
    navigator.clipboard.writeText(output).then(() => {
        alert('已复制到剪贴板');
    }).catch(() => {
        alert('复制失败，请手动复制');
    });
}
